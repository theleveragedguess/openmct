/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define([
    "./src/chart/MCTChartDirective",
    "./src/plot/MCTPlotDirective",
    './src/plot/MCTTicksDirective',
    "./src/telemetry/MCTOverlayPlot",
    "./src/telemetry/PlotController",
    "./src/telemetry/StackedPlotController",
    "./src/inspector/PlotInspector",
    "./src/inspector/PlotOptionsController",
    "./src/inspector/HideElementPoolDirective",
    "./src/services/ExportImageService",
    "text!./res/templates/plot-options-browse.html",
    "text!./res/templates/plot-options-edit.html",
    "text!./res/templates/stacked-plot.html",
    "text!./res/templates/plot.html"
], function (
    MCTChartDirective,
    MCTPlotDirective,
    MCTTicksDirective,
    MCTOverlayPlot,
    PlotController,
    StackedPlotController,
    PlotInspector,
    PlotOptionsController,
    HideElementPool,
    ExportImageService,
    plotOptionsBrowseTemplate,
    plotOptionsEditTemplate,
    StackedPlotTemplate,
    PlotTemplate
) {

    function PlotPlugin() {
        return function install(openmct) {
            openmct.legacyRegistry.register("openmct/plot", {
                "name": "Plot view for telemetry, reborn",
                "extensions": {
                    "views": [
                        {
                            "name": "Plot",
                            "key": "plot-single",
                            "cssClass": "icon-telemetry",
                            "template": PlotTemplate,
                            "needs": [
                                "telemetry"
                            ],
                            "uses": [
                                "composition"
                            ],
                            "delegation": false,
                            "priority": "mandatory"
                        },
                        {
                            "name": "Overlay Plot",
                            "key": "overlayPlot",
                            "cssClass": "icon-plot-overlay",
                            "type": "telemetry.plot.overlay",
                            "template": PlotTemplate,
                            "needs": [
                                "telemetry",
                                "composition"
                            ],
                            "uses": [
                                "composition"
                            ],
                            "editable": true,
                            "delegation": true
                        },
                        {
                            "name": "Stacked Plot",
                            "key": "stackedPlot",
                            "cssClass": "icon-plot-stacked",
                            "type": "telemetry.plot.stacked",
                            "template": StackedPlotTemplate,
                            "needs": [
                                "composition",
                                "delegation"
                            ],
                            "uses": [
                                "composition"
                            ],
                            "editable": true,
                            "delegation": true
                        }
                    ],
                    "directives": [
                        {
                            "key": "mctTicks",
                            "implementation": MCTTicksDirective,
                            "depends": []
                        },
                        {
                            "key": "mctChart",
                            "implementation": MCTChartDirective,
                            "depends": [
                                "$interval",
                                "$log"
                            ]
                        },
                        {
                            "key": "mctPlot",
                            "implementation": MCTPlotDirective,
                            "depends": [],
                            "templateUrl": "templates/mct-plot.html"
                        },
                        {
                            "key": "mctOverlayPlot",
                            "implementation": MCTOverlayPlot,
                            "depends": []
                        },
                        {
                            "key": "hideElementPool",
                            "implementation": HideElementPool,
                            "depends": []
                        }
                    ],
                    "controllers": [
                        {
                            "key": "PlotController",
                            "implementation": PlotController,
                            "depends": [
                                "$scope",
                                "$element",
                                "formatService",
                                "openmct",
                                "objectService",
                                "exportImageService"
                            ]
                        },
                        {
                            "key": "StackedPlotController",
                            "implementation": StackedPlotController,
                            "depends": [
                                "$scope",
                                "openmct",
                                "objectService",
                                "$element",
                                "exportImageService"
                            ]
                        },
                        {
                            "key": "PlotOptionsController",
                            "implementation": PlotOptionsController,
                            "depends": [
                                "$scope",
                                "openmct",
                                "$timeout"
                            ]
                        }
                    ],
                    "services": [
                        {
                            "key": "exportImageService",
                            "implementation": ExportImageService,
                            "depends": [
                                "$q",
                                "$timeout",
                                "$log"
                            ]
                        }
                    ],
                    "types": [
                        {
                            "key": "telemetry.plot.overlay",
                            "name": "Overlay Plot",
                            "cssClass": "icon-plot-overlay",
                            "description": "Combine multiple telemetry elements and view them together as a plot with common X and Y axes. Can be added to Display Layouts.",
                            "delegates": [
                                "telemetry"
                            ],
                            "features": "creation",
                            "contains": [
                                {
                                    "has": "telemetry"
                                }
                            ],
                            "model": {
                                composition: [],
                                configuration: {
                                    series: [],
                                    yAxis: {},
                                    xAxis: {}
                                }
                            },
                            "properties": [],
                            "inspector": PlotInspector,
                            "priority": 891
                        },
                        {
                            "key": "telemetry.plot.stacked",
                            "name": "Stacked Plot",
                            "cssClass": "icon-plot-stacked",
                            "description": "Combine multiple telemetry elements and view them together as a plot with a common X axis and individual Y axes. Can be added to Display Layouts.",
                            "delegates": [
                                "delegation"
                            ],
                            "features": "creation",
                            "contains": [
                                "telemetry.plot.overlay",
                                {"has": "telemetry"},
                            ],
                            "model": {
                                "composition": []
                            },
                            "properties": [],
                            "priority": 890
                        }
                    ],
                    "representations": [
                        {
                            "key": "plot-options-browse",
                            "template": plotOptionsBrowseTemplate
                        },
                        {
                            "key": "plot-options-edit",
                            "template": plotOptionsEditTemplate
                        }
                    ]
                }
            });

            openmct.legacyRegistry.enable("openmct/plot");
        }
    }

    return PlotPlugin
});