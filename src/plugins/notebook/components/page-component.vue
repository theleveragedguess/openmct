<template>
<div class="c-list__item js-list__item"
     :class="[{ 'is-selected': page.isSelected, 'is-default' : (defaultPageId === page.id) }]"
     :data-id="page.id"
     @click="selectPage"
>
    <span class="c-list__item__name js-list__item__name"
          :data-id="page.id"
          @blur="updateName"
    >
        {{ page.name.length ? page.name : `Unnamed ${page.pageTitle}` }}
    </span>
    <button class="c-icon-button icon-trash"
            :data-id="page.id"
            title="Delete Page"
            @click="deletePage"
    >
    </button>
</div>
</template>

<script>
import { EVENT_DELETE_PAGE, EVENT_RENAME_PAGE, EVENT_SELECT_PAGE } from '../notebook-constants';

export default {
    inject: ['openmct'],
    props: {
        defaultPageId: {
            type: String,
            default() {
                return '';
            }
        },
        page: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
        }
    },
    watch: {
        page(newPage) {
            this.toggleContentEditable(newPage);
        }
    },
    mounted() {
        this.toggleContentEditable();
    },
    destroyed() {
    },
    methods: {
        deletePage() {
            const self = this;
            const target = event.target;
            const id = target.dataset.id;

            if (!id) {
                return;
            }

            const dialog = self.openmct.overlays.dialog({
                iconClass: "error",
                message: 'This action will delete this page and all of its entries. Do you want to continue?',
                buttons: [{
                    label: "No",
                    callback: function () {
                        dialog.dismiss();
                    }
                },
                {
                    label: "Yes",
                    emphasis: true,
                    callback: function () {
                        self.$emit(EVENT_DELETE_PAGE, id);
                        dialog.dismiss();
                    }
                }]
            });
        },
        selectPage(event) {
            const target = event.target;
            const page = target.closest('.js-list__item');
            const input = page.querySelector('.js-list__item__name');

            if (page.className.indexOf('is-selected') > -1) {
                input.contentEditable = true;
                input.classList.add('c-input-inline');
                document.execCommand('selectAll',false,null);
                return;
            }

            const id = target.dataset.id;
            if (!id) {
                return;
            }

            this.$emit(EVENT_SELECT_PAGE, id);
        },
        toggleContentEditable(page = this.page) {
            const pageTitle = this.$el.querySelector('span');
            pageTitle.contentEditable = page.isSelected;
        },
        updateName(event) {
            const target = event.target;
            const name = target.textContent.toString();
            target.contentEditable = false;
            target.classList.remove('c-input-inline');

            if (this.page.name === name) {
                return;
            }

            if (name === '') {
                return;
            }

            this.$emit(EVENT_RENAME_PAGE, Object.assign(this.page, { name }));
        }
    }
}
</script>