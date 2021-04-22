﻿using Momentum.Framework.Core.Models;
using System;
using System.ComponentModel.DataAnnotations;

namespace Momentum.Reports.Core.Models
{
    public class Report : TimeTrackedModel
    {
        public Guid Id { get; set; }
        public string Data { get; set; }
        public ushort Type { get; set; }
        public uint Category { get; set; }
        [StringLength(1000)]
        public string Messgae { get; set; }
        public bool Resolved { get; set; } = false;
        [StringLength(1000)]
        public string ResolutionMessage { get; set; }
    }
}
