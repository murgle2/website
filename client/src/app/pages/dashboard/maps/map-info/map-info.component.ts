import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { switchMap, takeUntil } from 'rxjs/operators';
import { MapsService } from '../../../../@core/data/maps.service';
import { MomentumMap } from '../../../../@core/models/momentum-map.model';
import { LocalUserService } from '../../../../@core/data/local-user.service';
import { NgxGalleryAnimation, NgxGalleryImage, NgxGalleryOptions } from 'ngx-gallery';
import { MapImage } from '../../../../@core/models/map-image.model';
import { Role } from '../../../../@core/models/role.model';
import { ReportType } from '../../../../@core/models/report-type.model';
import { MomentumMapPreview } from '../../../../@core/models/momentum-map-preview.model';
import { NbDialogRef, NbDialogService, NbToastrService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { Activity_Type } from '../../../../@core/models/activity-type.model';
import { MapFollow } from '../../../../@core/models/map-follow.model';

@Component({
  selector: 'map-notify-edit',
  template: `
    <nb-card>
      <nb-card-header>
        Edit Notification Settings
      </nb-card-header>
      <nb-card-body>
        Notify me when
        <nb-checkbox [(ngModel)]="checkboxFlags.PB.checked">
          {{ActivityType[ActivityType.PB_ACHIEVED]}}
        </nb-checkbox>
        <nb-checkbox [(ngModel)]="checkboxFlags.WR.checked">
          {{ActivityType[ActivityType.WR_ACHIEVED]}}
        </nb-checkbox>
      </nb-card-body>
      <nb-card-footer>
        <button class="btn btn-danger" (click)="close()">Close</button>
        <button class="btn btn-primary" (click)="submit()">Submit</button>
      </nb-card-footer>
    </nb-card>
  `,
  styles: [`button { margin: 1rem; }`],
})
export class MapNotifyEditComponent implements OnInit {
  @Input() flags: number;
  ActivityType: typeof Activity_Type = Activity_Type;
  checkboxFlags = {
    PB: { checked: false, value: Activity_Type.PB_ACHIEVED },
    WR: { checked: false, value: Activity_Type.WR_ACHIEVED },
  };
  constructor(protected dialogRef: NbDialogRef<MapNotifyEditComponent>) {
  }

  ngOnInit() {
    for (const perm in this.checkboxFlags) {
      if ((1 << this.checkboxFlags[perm].value) & this.flags) {
        this.checkboxFlags[perm].checked = true;
      }
    }
  }

  close() {
    this.dialogRef.close();
  }
  submit() {
    for (const perm in this.checkboxFlags) {
      if (this.checkboxFlags[perm].checked) {
        this.flags |= (1 << this.checkboxFlags[perm].value);
      } else
        this.flags &= ~(1 << this.checkboxFlags[perm].value);
    }
    this.dialogRef.close({ newFlags: this.flags });
  }
}







@Component({
  selector: 'map-info',
  templateUrl: './map-info.component.html',
  styleUrls: ['./map-info.component.scss'],
})

export class MapInfoComponent implements OnInit, OnDestroy {

  private ngUnsub = new Subject();
  @Input('previewMap') previewMap: MomentumMapPreview;
  ReportType: typeof ReportType;
  map: MomentumMap;
  mapFollow: MapFollow;
  mapNotifications: boolean;
  mapInLibrary: boolean;
  mapInFavorites: boolean;
  isSubmitter: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  galleryOptions: NgxGalleryOptions[];
  galleryImages: NgxGalleryImage[];

  constructor(private route: ActivatedRoute,
              private router: Router,
              private mapService: MapsService,
              private locUserService: LocalUserService,
              private toastService: NbToastrService,
              private dialogService: NbDialogService) {
    this.ReportType = ReportType;
    this.mapInLibrary = false;
    this.map = null;
    this.previewMap = null;
    this.mapInFavorites = false;
    this.mapFollow = null;
    this.mapNotifications = false;
    this.galleryOptions = [
      {
        width: '100%',
        height: '400px',
        thumbnailsColumns: 4,
        imageAnimation: NgxGalleryAnimation.Slide,
        previewCloseOnClick: true,
        previewCloseOnEsc: true,
      },
      // max-width 800
      {
        breakpoint: 800,
        width: '100%',
        height: '300px',
        imagePercent: 80,
        thumbnailsPercent: 20,
        thumbnailsMargin: 20,
        thumbnailMargin: 20,
      },
      // max-width 400
      {
        breakpoint: 400,
        preview: false,
      },
    ];
    this.galleryImages = [];
  }

  ngOnInit() {
    if (this.previewMap) {
      this.map = this.previewMap.map;
      this.updateGalleryImages(this.previewMap.images);
    } else {
      this.route.paramMap.pipe(
        switchMap((params: ParamMap) =>
          this.mapService.getMap(Number(params.get('id')), {
            params: {expand: 'info,credits,submitter,stats,images,inFavorites,inLibrary,tracks'},
          }),
        ),
      ).subscribe(map => {
        this.map = map;
        this.locUserService.checkMapNotify(this.map.id).subscribe(resp => {
          this.mapFollow = resp;
          this.mapNotifications = true;
        }, err => {
          this.toastService.danger(err.message, 'Could not check if following');
        });
        if (this.map.favorites && this.map.favorites.length)
          this.mapInFavorites = true;
        if (this.map.libraryEntries && this.map.libraryEntries.length)
          this.mapInLibrary = true;
        this.updateGalleryImages(map.images);
        this.locUserService.getLocal().pipe(
          takeUntil(this.ngUnsub),
        ).subscribe(locUser => {
          this.isAdmin = this.locUserService.hasRole(Role.ADMIN, locUser);
          this.isModerator = this.locUserService.hasRole(Role.MODERATOR, locUser);
          this.isSubmitter = this.map.submitterID === locUser.id;
        });
      });
    }
  }

  ngOnDestroy(): void {
    this.ngUnsub.next();
    this.ngUnsub.complete();
  }

  onLibraryUpdate() {
    if (this.mapInLibrary) {
      this.locUserService.removeMapFromLibrary(this.map.id).subscribe(() => {
        this.mapInLibrary = false;
        this.map.stats.totalSubscriptions--;
      });
    } else {
      this.locUserService.addMapToLibrary(this.map.id).subscribe(resp => {
        this.mapInLibrary = true;
        this.map.stats.totalSubscriptions++;
      }, error => {
        this.toastService.danger(error.message, 'Cannot add map to library');
      });
    }
  }

  onFavoriteUpdate() {
    if (this.mapInFavorites) {
      this.locUserService.removeMapFromFavorites(this.map.id).subscribe(() => {
        this.mapInFavorites = false;
        this.map.stats.totalFavorites--;
      });
    } else {
      this.locUserService.addMapToFavorites(this.map.id).subscribe(resp => {
        this.mapInFavorites = true;
        this.map.stats.totalFavorites++;
      }, error => {
        this.toastService.danger(error.message, 'Failed to add map to favorites');
      });
    }
  }

  editNotificationSettings() {
    this.dialogService.open(MapNotifyEditComponent, {
      context: {
        flags: (this.mapFollow ? this.mapFollow.notifyOn : 0),
      },
    }).onClose.subscribe(resp => {
      if (resp) {
        if (resp.newFlags == 0) {
          if (this.mapFollow != null) {
            this.locUserService.disableMapNotify(this.map.id).subscribe(() => {
              this.mapFollow.notifyOn = 0;
              this.mapNotifications = false;
            }, err => {
              this.toastService.danger('Could not disable notifications', err.message);
            });
          }
        }
        else {
          this.locUserService.updateMapNotify(this.map.id, resp.newFlags).subscribe(res => {
            this.mapNotifications = true;
            if (this.mapFollow == null)
              this.mapFollow = res;
            else
              this.mapFollow.notifyOn = resp.newFlags;
          }, err => {
            this.toastService.danger('Could not enable notificaions', err.message);
          })
        }
      }
    })
  }

  updateGalleryImages(mapImages: MapImage[]) {
    this.galleryImages = [];
    for (let i = 0; i < mapImages.length; i++) {
      this.galleryImages.push({
        small: mapImages[i].small,
        medium: mapImages[i].medium,
        big: mapImages[i].large,
      });
    }
  }

  onEditMap() {
    this.router.navigate(['/dashboard/maps/' + this.map.id + '/edit']);
  }

}
