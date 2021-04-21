﻿using System.Text.Json.Serialization;

namespace Momentum.XpSystems.Api.ViewModels.Rank
{
    public class GroupsViewModel
    {
        [JsonPropertyName("maxGroups")]
        public int MaxGroups { get; set; }
        [JsonPropertyName("groupScaleFactors")]
        public float[] GroupScaleFactors { get; set; }
        [JsonPropertyName("groupExponents")]
        public float[] GroupExponents { get; set; }
        [JsonPropertyName("groupMinimumSizes")]
        public int[] GroupMinimumSizes { get; set; }
        [JsonPropertyName("groupPointPcts")]
        public float[] GroupPointPercentages { get; set; }
    }
}