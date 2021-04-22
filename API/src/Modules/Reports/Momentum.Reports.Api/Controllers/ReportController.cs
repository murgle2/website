using MediatR;
using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Momentum.Reports.Api.Controllers
{
    [ApiController]
    public class ReportController : Controller
    {
        private readonly IMediator _mediator;
        private readonly IMapper _mapper;

        public ReportController(IMediator mediator, IMapper mapper)
        {
            _mediator = mediator;
            _mapper = mapper;
        }
        
        [Route("api/reports")]
        [HttpPost]
        public async Task<IActionResult> GetReportAsync()
        {

            return Ok();
        }

/*        [Route("api/admin/reports")]
        [HttpGet]

        [Route("api/admin/reports/{id}")]
        [HttpPatch]*/
    }
}
