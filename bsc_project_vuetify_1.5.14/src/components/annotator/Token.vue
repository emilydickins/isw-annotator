<template functional>
        <span
            @click.exact="listeners['annotator-token-click'](props.index)"
            @click.shift="listeners['annotator-token-click-shift'](props.index)"
            @click.ctrl="listeners['annotator-token-click-ctrl'](props.index)"

            :id="'token_'+props.index"
            class="annotator-token-inner"
            :class="['token-inner-default',
            props.show_pos && !props.isLinking ? props.posClass:'token-outer-default', 'whitespace',
            {
              hasOnlyName: props.hasName && !props.hasTore,  // indicates that a token has been assigned to a code
              hasOnlyTore: !props.hasName && props.hasTore,
              hasBoth: props.hasName && props.hasTore,
              isAlgoLemma: props.algo_lemma,
              highlightInSelectedCode: ((props.isLinking || props.annotatorInputVisible) && props.inSelectedCode), // currently SELECTED code
              linkedTogether: props.linkedTogether
            }]">
          {{props.name}}
        </span>
</template>

<script>

    export default {
        name: "Token",
        functional:true,

        props: {
            name: {
                type: String,
                required: true
            },
            lemma: String,
            pos: String,
            tore: String,
            index: {
                type: Number,
                required: true
            },
            inSelectedCode: {
                type: Boolean,
                required: true
            },

            hasName: {
                type: Boolean,
                required: true
            },
            hasTore: {
                type: Boolean,
                required: true
            },

            linkedTogether: {
                type: Boolean,
                required: true
            },
            isLinking: {
                type: Boolean,
                required: true
            },
            algo_lemma: {
                type: Boolean,
                required: true
            },
            show_pos: {
                type: Boolean,
                required: true
            },
            posClass: {
                type: String,
                required: true
            },
            annotatorInputVisible: {
                type: Boolean,
                required: true
            }
        }
    }
</script>

<style scoped>

    .token-inner-default{
        color: black;
        font-size: 18px;
        user-select: none;
        border: 2px solid transparent;
    }

    .n, .v, .a{
        border: 2px solid;
    }

    .n {
        border-color: #bd3518;
    }

    .v {
        border-color: #002aff;
    }

    .a {
        border-color: #3cff3c;
    }

    .whitespace {
        margin-right: 0.7em;
    }

    .hasOnlyName {
        background-color: lightblue;
    }

    .hasOnlyTore {
        background-color: #fff668;
    }


    .hasBoth {
        background-color: #66f877;
    }

    .isAlgoLemma {
      border: #ff6781 solid 2px;
    }
    .linkedTogether {
        border: #0066ff solid 2px;
    }

    .highlightInSelectedCode {
      border: black solid 2px;
    }

</style>