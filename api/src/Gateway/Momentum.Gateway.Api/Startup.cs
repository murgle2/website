using System.Linq;
using Marten;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Momentum.Auth.Core.Services;
using Momentum.Framework.Core.DependencyInjection;
using Momentum.Framework.Core.Services;
using Momentum.Gateway.Api.Helpers;

namespace Momentum.Gateway.Api
{
    public class Startup
    {
        private readonly IModuleInitializer[] _modules;
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
            _modules = ModulesUtility.GetModules().ToArray();
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Add controllers from this assembly + the modules
            services.AddControllers()
                .AddModuleControllers(_modules);
            
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "Momentum.Gateway.Api",
                    Version = "v1"
                });
            });

            // Add JWT and Steam
            services.AddMomentumAuthentication(Configuration);
            services.AddMomentumAuthorization();
            
            // Register each modules DI
            foreach (var module in _modules)
            {
                module.ConfigureServices(services);
            }
            
            // Add global dependencies
            services.AddHttpContextAccessor();
            services.AddScoped<ICurrentUserService, CurrentUserService>();

            // Add MediatR and register the requests/handlers from all modules
            services.AddMediatR(_modules.Select(x => x.GetType().Assembly).ToArray());

            services.AddMarten(options =>
            {
                options.Connection(Configuration.GetConnectionString("Marten"));

                // TODO: Make this more restrictive before production
                options.AutoCreateSchemaObjects = AutoCreate.All;
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
            });
            
            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Momentum.Gateway.Api v1"));

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}