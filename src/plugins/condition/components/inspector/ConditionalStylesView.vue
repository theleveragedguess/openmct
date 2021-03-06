/*****************************************************************************
* Open MCT, Copyright (c) 2014-2020, United States Government
* as represented by the Administrator of the National Aeronautics and Space
* Administration. All rights reserved.
*
* Open MCT is licensed under the Apache License, Version 2.0 (the
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
* Open MCT includes source code licensed under additional open source
* licenses. See the Open Source Licenses file (LICENSES.md) included with
* this source code distribution or the Licensing information page available
* at runtime from the About dialog for additional information.
*****************************************************************************/

<template>
<div class="c-inspector__styles c-inspect-styles">
    <template v-if="!conditionSetDomainObject">
        <div class="c-inspect-styles__header">
            Object Style
        </div>
        <div class="c-inspect-styles__content">
            <div v-if="staticStyle"
                 class="c-inspect-styles__style"
            >
                <style-editor class="c-inspect-styles__editor"
                              :style-item="staticStyle"
                              :is-editing="isEditing"
                              @persist="updateStaticStyle"
                />
            </div>
            <button
                id="addConditionSet"
                class="c-button c-button--major c-toggle-styling-button labeled"
                @click="addConditionSet"
            >
                <span class="c-cs-button__label">Use Conditional Styling...</span>
            </button>
        </div>
    </template>
    <template v-else>
        <div class="c-inspect-styles__header">
            Conditional Object Styles
        </div>
        <div class="c-inspect-styles__content c-inspect-styles__condition-set">
            <a v-if="conditionSetDomainObject"
               class="c-object-label icon-conditional"
               :href="navigateToPath"
               @click="navigateOrPreview"
            >
                <span class="c-object-label__name">{{ conditionSetDomainObject.name }}</span>
            </a>
            <template v-if="isEditing">
                <button
                    id="changeConditionSet"
                    class="c-button labeled"
                    @click="addConditionSet"
                >
                    <span class="c-button__label">Change...</span>
                </button>

                <button class="c-click-icon icon-x"
                        title="Remove conditional styles"
                        @click="removeConditionSet"
                ></button>
            </template>
        </div>

        <div v-if="conditionsLoaded"
             class="c-inspect-styles__conditions"
        >
            <div v-for="(conditionStyle, index) in conditionalStyles"
                 :key="index"
                 class="c-inspect-styles__condition"
            >
                <condition-error :show-label="true"
                                 :condition="getCondition(conditionStyle.conditionId)"
                />
                <condition-description :show-label="true"
                                       :condition="getCondition(conditionStyle.conditionId)"
                />
                <style-editor class="c-inspect-styles__editor"
                              :style-item="conditionStyle"
                              :is-editing="isEditing"
                              @persist="updateConditionalStyle"
                />
            </div>
        </div>
    </template>
</div>
</template>

<script>

import StyleEditor from "./StyleEditor.vue";
import ConditionSetSelectorDialog from "./ConditionSetSelectorDialog.vue";
import ConditionDescription from "@/plugins/condition/components/ConditionDescription.vue";
import ConditionError from "@/plugins/condition/components/ConditionError.vue";
import Vue from 'vue';
import PreviewAction from "@/ui/preview/PreviewAction.js";

export default {
    name: 'ConditionalStylesView',
    components: {
        ConditionDescription,
        ConditionError,
        StyleEditor
    },
    inject: [
        'openmct',
        'domainObject'
    ],
    props: {
        itemId: {
            type: String,
            default: ''
        },
        initialStyles: {
            type: Object,
            default() {
                return undefined;
            }
        },
        canHide: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            conditionalStyles: [],
            staticStyle: undefined,
            conditionSetDomainObject: undefined,
            isEditing: this.openmct.editor.isEditing(),
            conditions: undefined,
            conditionsLoaded: false,
            navigateToPath: ''
        }
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.setEditState);
    },
    mounted() {
        this.previewAction = new PreviewAction(this.openmct);
        if (this.domainObject.configuration && this.domainObject.configuration.objectStyles) {
            let objectStyles = this.itemId ? this.domainObject.configuration.objectStyles[this.itemId] : this.domainObject.configuration.objectStyles;
            this.initializeStaticStyle(objectStyles);
            if (objectStyles && objectStyles.conditionSetIdentifier) {
                this.openmct.objects.get(objectStyles.conditionSetIdentifier).then(this.initialize);
                this.conditionalStyles = objectStyles.styles;
            }
        } else {
            this.initializeStaticStyle();
        }
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    methods: {
        initialize(conditionSetDomainObject) {
            //If there are new conditions in the conditionSet we need to set those styles to default
            this.conditionSetDomainObject = conditionSetDomainObject;
            this.enableConditionSetNav();
            this.initializeConditionalStyles();
        },
        setEditState(isEditing) {
            this.isEditing = isEditing;
        },
        addConditionSet() {
            let conditionSetDomainObject;
            const handleItemSelection = (item) => {
                if (item) {
                    conditionSetDomainObject = item;
                }
            };
            const dismissDialog = (overlay, initialize) => {
                overlay.dismiss();
                if (initialize && conditionSetDomainObject) {
                    this.conditionSetDomainObject = conditionSetDomainObject;
                    this.conditionalStyles = [];
                    this.initializeConditionalStyles();
                }
            };
            let vm = new Vue({
                provide: {
                    openmct: this.openmct
                },
                components: {ConditionSetSelectorDialog},
                data() {
                    return {
                        handleItemSelection
                    }
                },
                template: '<condition-set-selector-dialog @conditionSetSelected="handleItemSelection"></condition-set-selector-dialog>'
            }).$mount();

            let overlay = this.openmct.overlays.overlay({
                element: vm.$el,
                size: 'small',
                buttons: [
                    {
                        label: 'OK',
                        emphasis: 'true',
                        callback: () => dismissDialog(overlay, true)
                    },
                    {
                        label: 'Cancel',
                        callback: () => dismissDialog(overlay, false)
                    }
                ],
                onDestroy: () => vm.$destroy()
            });
        },
        enableConditionSetNav() {
            this.openmct.objects.getOriginalPath(this.conditionSetDomainObject.identifier).then(
                (objectPath) => {
                    this.objectPath = objectPath;
                    this.navigateToPath = '#/browse/' + this.objectPath
                        .map(o => o && this.openmct.objects.makeKeyString(o.identifier))
                        .reverse()
                        .join('/');
                }
            );
        },
        navigateOrPreview(event) {
            // If editing, display condition set in Preview overlay; otherwise nav to it while browsing
            if (this.openmct.editor.isEditing()) {
                event.preventDefault();
                this.previewAction.invoke(this.objectPath);
            }
        },
        removeConditionSet() {
            this.conditionSetDomainObject = undefined;
            this.conditionalStyles = [];
            let domainObjectStyles =  (this.domainObject.configuration && this.domainObject.configuration.objectStyles) || {};
            if (this.itemId) {
                domainObjectStyles[this.itemId].conditionSetIdentifier = undefined;
                delete domainObjectStyles[this.itemId].conditionSetIdentifier;
                domainObjectStyles[this.itemId].styles = undefined;
                delete domainObjectStyles[this.itemId].styles;
                if (_.isEmpty(domainObjectStyles[this.itemId])) {
                    delete domainObjectStyles[this.itemId];
                }
            } else {
                domainObjectStyles.conditionSetIdentifier = undefined;
                delete domainObjectStyles.conditionSetIdentifier;
                domainObjectStyles.styles = undefined;
                delete domainObjectStyles.styles;
            }
            if (_.isEmpty(domainObjectStyles)) {
                domainObjectStyles = undefined;
            }

            this.persist(domainObjectStyles);
        },
        initializeConditionalStyles() {
            if (!this.conditions) {
                this.conditions = {};
            }
            let conditionalStyles = [];
            this.conditionSetDomainObject.configuration.conditionCollection.forEach((conditionConfiguration, index) => {
                this.conditions[conditionConfiguration.id] = conditionConfiguration;
                let foundStyle = this.findStyleByConditionId(conditionConfiguration.id);
                if (foundStyle) {
                    foundStyle.style = Object.assign((this.canHide ? { isStyleInvisible: '' } : {}), this.initialStyles, foundStyle.style);
                    conditionalStyles.push(foundStyle);
                } else {
                    conditionalStyles.splice(index, 0, {
                        conditionId: conditionConfiguration.id,
                        style: Object.assign((this.canHide ? { isStyleInvisible: '' } : {}), this.initialStyles)
                    });
                }
            });
            //we're doing this so that we remove styles for any conditions that have been removed from the condition set
            this.conditionalStyles = conditionalStyles;
            this.conditionsLoaded = true;
            this.persist(this.getDomainObjectConditionalStyle());
        },
        initializeStaticStyle(objectStyles) {
            let staticStyle = objectStyles && objectStyles.staticStyle;
            this.staticStyle = staticStyle || {
                style: Object.assign({}, this.initialStyles)
            };
        },
        findStyleByConditionId(id) {
            return this.conditionalStyles.find(conditionalStyle => conditionalStyle.conditionId === id);
        },
        updateStaticStyle(staticStyle) {
            this.staticStyle = staticStyle;
            this.persist(this.getDomainObjectConditionalStyle());
        },
        updateConditionalStyle(conditionStyle) {
            let found = this.findStyleByConditionId(conditionStyle.conditionId);
            if (found) {
                found.style = conditionStyle.style;
                this.persist(this.getDomainObjectConditionalStyle());
            }
        },
        getDomainObjectConditionalStyle() {
            let objectStyle = {
                styles: this.conditionalStyles,
                staticStyle: this.staticStyle
            };
            if (this.conditionSetDomainObject) {
                objectStyle.conditionSetIdentifier = this.conditionSetDomainObject.identifier;
            }

            let domainObjectStyles =  (this.domainObject.configuration && this.domainObject.configuration.objectStyles) || {};

            if (this.itemId) {
                domainObjectStyles[this.itemId] = objectStyle;
            } else {
                //we're deconstructing here to ensure that if an item within a domainObject already had a style we don't lose it
                domainObjectStyles = {
                    ...domainObjectStyles,
                    ...objectStyle
                }
            }

            return domainObjectStyles;
        },
        getCondition(id) {
            return this.conditions ? this.conditions[id] : {};
        },
        persist(style) {
            this.openmct.objects.mutate(this.domainObject, 'configuration.objectStyles', style);
        }
    }
}
</script>
