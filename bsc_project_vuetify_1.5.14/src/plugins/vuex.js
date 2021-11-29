/* eslint-disable no-console */
import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import {
    Code_update_token,
    Code_remove_relationship, CodeToString, TORERelationship, TORERelationship_add_token,
    TORERelationship_set_relationship_name, Code_add_relationship, TORERelationship_remove_token, Code_remove_token
} from "@/components/annotator/code"
import {NOUN_COLOR, VERB_COLOR, ADJECTIVE_COLOR} from "@/components/annotator/resources/color";

Vue.use(Vuex)

import {
    GET_EXAMPLE_ANNOTATION_POST_ENDPOINT,
    ANNOTATION_GET_ALL_ENDPOINT,
    ANNOTATION_GET_ENDPOINT,
    ANNOTATION_POST_ENDPOINT,
    ANNOTATION_DELETE_ENDPOINT,
    GET_ALL_RELATIONSHIPS_ENDPOINT,
    GET_ALL_TORES_ENDPOINT, POST_ALL_RELATIONSHIPS_ENDPOINT, POST_ALL_TORES_ENDPOINT
} from "@/RESTconf";

const store = new Vuex.Store({
    state: {
        // DO NOT INCLUDE IN DEPLOYMENT
        datasets: ["interview_data_normal"],

        results: [
            {method: "frequency-fcic", name: "Result: Things", topics: {concepts: ["mOodle"]}, dataset_name: "interview_data_normal"},
            {method: "frequency-rbai", name: "Result: Verbs", topics: {concepts: ["click"]},  dataset_name: "interview_data_normal"}
        ],

        // END DO NOT INCLUDE IN DEPLOYMENT

        pos_tags: [
                        {name: "Verbs", tag: "v", color: VERB_COLOR},
                        {name: "Nouns", tag: "n", color: NOUN_COLOR},
                        {name: "Adjectives", tag: "a", color: ADJECTIVE_COLOR}
                    ],

        relationship_owners: [],  // tore at index i owns the relationship name at index i
        relationship_names: [],  // relationship types
        tores: [],  // tore categories

        annotatorInputVisible: false,
        selected_code: null,

        selectedToken: null,
        isLinking: false,

        selected_tore_relationship: null,

        annotator_uploaded_at: null,
        annotator_dataset: null,
        docs: [],  // document indices from the server start at 1!
        tokens: [],
        codes: [],
        tore_relationships: [],
        //doc_tokens: [],  // for performance reasons, manually update this array

        token_in_selected_code: [],
        //token_pos_selected: [],
        //token_is_algo_lemma: [],
        token_linked_together: [],
        token_num_name_codes: [],
        token_num_tore_codes: [],

        all_docs: {index: 0, name: "All Documents", begin_index: 0, end_index: null},
        selected_doc: null, // set it to first when loading
        selected_pos_tags: [],
        selected_algo_result: null,  // used only in annotation view

        annotatorViewingCodeResults: false,
        available_annotations: [],
        isLoadingAnnotation: false,  // loading the annotation to be displayed
        selected_annotation: null,
        isLoadingAvailableAnnotations: false,
        lastAnnotationEditAt: null,
        lastAnnotationPostAt: null
    },

    getters: {

        showingInput(state){
            return state.selected_code && state.annotatorInputVisible;
        },

        lemmasFromSelectedResult(state){
            console.log("lemmasFromSelectedResult recomputing");
            let ret = [];
            let frequency_methods = ["frequency-fcic", "frequency-rbai"];
            if (frequency_methods.includes(state.selected_algo_result.method)){
                ret = state.selected_algo_result.topics.concepts;
            } else {
                try{
                    let result = state.selected_algo_result;
                    let list = [];
                    // eslint-disable-next-line guard-for-in
                    for (let topic in result.topics) {
                        // eslint-disable-next-line guard-for-in
                        for (let index in result.topics[topic]) {
                            let word = result.topics[topic][index];
                            if (word.length <= 1) {
                                // eslint-disable-next-line no-continue
                                continue;
                            }
                            if (!(list.indexOf(word) > -1)) {
                                list.push(word);
                            }
                        }
                    }
                    ret.concat(list.sort());
                    console.log("Got non-frequency keywords: ")
                    console.log(ret)
                } catch (e) {
                    console.error("Failed to get keywords: "+e)
                }

            }
            return ret.map(l => (l?l.toLowerCase():l));
        },

        annotationAlgoResults(state){
            const valid_methods = ["frequency-fcic", "frequency-rbai"];
            return state.results.filter(r => r.dataset_name === state.annotator_dataset && valid_methods.includes(r.method));
        },

        docs(state){
            return state.docs
        },
        selected_doc(state){
            console.log("selected_doc")
            return state.selected_doc
        },

        selectedToken(state){
            return state.selectedToken;
        },
        pos_tags(state){
            return state.pos_tags;
        },

        codeNames(state){
            let ret = [];
            for(let i = 0; i < state.codes.length; i++){
                if(state.codes[i] && state.codes[i].name){
                    ret.push(state.codes[i].name);
                }
            }
            return ret;
        },

        selected_tore_relationship(state){
            return state.selected_tore_relationship;
        },

        selected_code(state){
            return state.selected_code;
        },
        isLinking(state){
            return state.isLinking;
        },
        token: (state) => (index) => state.tokens[index],

        getCodesForToken: (state) => (token) => {
            console.log("getCodesForToken: "+(token?token.name:"null"))
            if (token===null || (state.token_num_name_codes[token.index] === 0 && state.token_num_tore_codes[token.index] === 0)){
                return [];
            } else {
                let ret = []
                let names_left_to_find = state.token_num_name_codes[token.index];
                let tore_left_to_find = state.token_num_tore_codes[token.index];
                for(let c of state.codes){
                    if(c) {
                        if(c.tokens.includes(token.index)){
                            ret.push(c);
                            if(c.name){
                                names_left_to_find--;
                            }
                            if(c.tore){
                                tore_left_to_find--;
                            }
                            if(names_left_to_find === 0 && tore_left_to_find === 0){
                                return ret;
                            }
                        }
                    }
                }
                console.error("getCodesForToken fell through, check implementation")
                console.error(names_left_to_find)
                console.error(tore_left_to_find)
                return ret;
            }
        },

        requiredAnnotationsPresent(state){
            return (state.selected_code.name !== null && state.selected_code.name !== "") || (state.selected_code.tore !== null && state.selected_code.tore !== "");
        },

        tokenListToString: (state) => (listOfTokenIndices) => {
            let ret = ""
            if(listOfTokenIndices === null || listOfTokenIndices === undefined){
                console.error("tokenListToString got null/undefined input");
                return "";
            }
            for (let index of [...listOfTokenIndices].sort()){
                ret += state.tokens[index].name + " "
            }
            return ret;
        },

        tokens: state => {
            console.log("tokens changed")
            return state.tokens
        },
        /*
        tokenInSelectedDoc: (state, getters) => {
            return state.selected_doc && state.docs[state.selected_doc].begin_index, state.docs[state.selected_doc].end_index
        },

        tokensInSelectedDoc: (state, getters) => {
            console.log("tokensInSelectedDoc changed")
            return getters.tokens && state.selected_doc !== null ? getters.tokens.slice(state.docs[state.selected_doc].begin_index, state.docs[state.selected_doc].end_index) : [];
        }*/
    },

    actions: {

        actionLoadResults: () => {
            console.error("Don't include this stub in production!");
        },

        actionPostAllRelationships: ({commit}, {newRelationships, newOwners}) => {
            return new Promise((resolve, reject) => {
                console.log("Posting all relationships.")
                axios.post(POST_ALL_RELATIONSHIPS_ENDPOINT, {relationship_names: newRelationships, owners: newOwners})
                    .then(r => {
                        commit("setRelationshipNames", newRelationships)
                        commit("setRelationshipOwners", newOwners)
                        resolve(r)
                    }).catch(e => {
                            console.error("Error posting relationships: "+e)
                            reject(e)

                })
            })
        },

        actionPostAllTores: ({commit}, newTores) => {
            return new Promise((resolve, reject) => {
                console.log("Posting all tores.")
                axios.post(POST_ALL_TORES_ENDPOINT, {tores: newTores})
                    .then(r => {
                        commit("setTores", newTores)
                        resolve(r);
                    })
                    .catch(e => {
                        console.error("Error posting tores: "+e)
                        reject(e)
                    })
            })
        },

        actionGetAllRelationships: ({commit}) => {
            return new Promise(() => {
                console.log("Getting all relationships.")
                axios.get(GET_ALL_RELATIONSHIPS_ENDPOINT)
                    .then(response => {
                        const {relationship_names, owners} = response.data;
                        console.log("Got all relationships")
                        commit("setRelationshipNames", relationship_names);
                        commit("setRelationshipOwners", owners);
                    })
                    .catch(e => console.error("Error getting relationships: "+e))
            })
        },

        actionGetAllTores: ({commit}) => {
            return new Promise(() => {
                console.log("Getting all tores.")
                axios.get(GET_ALL_TORES_ENDPOINT)
                    .then(response => {
                        const {tores} = response.data;
                        console.log("Got all tores")
                        commit("setTores", tores);
                    })
                    .catch(e => console.error("Error getting tores: "+e))
            })
        },


        actionGetNewAnnotation: ({
                                          commit
                                      }, {name, dataset}) => {
            return new Promise(() => {
                console.warn("Initializing annotation");
                commit("setIsLoadingAnnotation", true);
                axios.post(GET_EXAMPLE_ANNOTATION_POST_ENDPOINT, {
                    name,
                    dataset
                })
                    .then(response => {
                        console.log("actionGetExampleAnnotation Got good response.");
                        const {data} = response;
                        commit("setAnnotationPayload", data);
                        commit("updateDocTokens");
                    })
                    .catch(e => console.error("Error getting annotation: "+e)).finally(() => {
                        commit("setIsLoadingAnnotation", false)
                });
            });
        },

        actionGetSelectedAnnotation: ({commit, state}) => {
            return new Promise(() => {
                let name = state.selected_annotation;
                console.log("Getting annotation: "+name)
                commit("setIsLoadingAnnotation", true);
                axios.get(ANNOTATION_GET_ENDPOINT(name))
                    .then(response => {
                        console.log("Got response for annotation: "+name);
                        const {data} = response;
                        commit("setAnnotationPayload", data)
                        commit("updateDocTokens")
                    })
                    .catch(e => console.error("Error getting annotation: "+e)).finally(() => {
                    commit("setIsLoadingAnnotation", false)
                });
            })
        },


        actionGetAllAnnotations: ({commit}) => {
            return new Promise(() => {
                console.log("Getting all annotations...")
                commit("setIsLoadingAvailableAnnotations", true)
                axios.get(ANNOTATION_GET_ALL_ENDPOINT)
                    .then(response => {
                        console.log("Got all annotations: ");
                        const {data} = response;
                        console.log(data)
                        commit("setAvailableAnnotations", data);
                    })
                    .catch(e => console.error("Error getting all annotations: "+e)).finally(() => {
                    commit("setIsLoadingAvailableAnnotations", false)
                });
            })
        },

        actionPostCurrentAnnotation: ({state, commit}) => {
            return new Promise(() => {
                console.log("Posting annotation: "+state.selected_annotation);
                commit("postAnnotationCallback");

                let postTokens = [];
                for(let t of state.tokens){
                    postTokens.push({...t,
                        num_name_codes: state.token_num_name_codes[t.index],
                        num_tore_codes: state.token_num_tore_codes[t.index]})
                }

                axios.post(ANNOTATION_POST_ENDPOINT, {
                    uploaded_at: state.annotator_uploaded_at,
                    dataset: state.annotator_dataset,
                    name: state.selected_annotation,
                    tokens: postTokens,
                    tore_relationships: state.tore_relationships,
                    codes: state.codes,
                    docs: state.docs.slice(1, state.docs.length)
                } )
                    .then(() => {
                        console.log("Got annotation POST response")
                    })
                    .catch(e => console.error("Error POSTing annotation: "+e));
            })
        },

        actionDeleteAnnotation: ({dispatch, commit}, name) => {
            return new Promise(() => {
                console.log("Deleting annotation: "+name)
                commit("setIsLoadingAvailableAnnotations", true)
                axios.delete(ANNOTATION_DELETE_ENDPOINT(name))
                    .then(() => {
                        console.log("Annotation deleted, fetching available...")
                        dispatch("actionGetAllAnnotations").finally(() =>
                            commit("setIsLoadingAvailableAnnotations", false))
                    })
                    .catch(e => {
                        console.error("Error deleting annotation: " + e)
                    }).finally(() => {
                    commit("setIsLoadingAvailableAnnotations", false)
                    })
            })
        }
        },

    mutations: {

        removeTokenFromSelectedCode(state, token){
            Code_remove_token(state, this.commit, state.selected_code, token);
            Vue.set(state.token_in_selected_code, token.index, false);
        },

        setTores(state, tores){
            state.tores = tores;
        },

        setRelationshipNames(state, relationship_names){
            state.relationship_names = relationship_names;
        },

        setRelationshipOwners(state, owners){
            state.relationship_owners = owners;
        },

        toggleAnnotatorViewingCodes(state, show){
            state.annotatorViewingCodeResults = show;
            console.log("Toggled annotator code view to: "+state.annotatorViewingCodeResults)
        },

        /**
         * Requires state.tokens to be set!
         * @param state
         * @param tear_down
         */
        initTokensEfficiencyStructs(state, tear_down){
            console.warn("Initializing token efficiency structs")
            let token_in_selected_code = [];
            //let token_pos_selected = [];
            //let token_is_algo_lemma = [];
            let token_linked_together = [];
            let token_num_name_codes = [];
            let token_num_tore_codes = [];

            if(!tear_down){
                // eslint-disable-next-line no-unused-vars
                for(let t of state.tokens){
                    token_in_selected_code.push(false)
                    //token_pos_selected.push(false)
                    //token_is_algo_lemma.push(false)
                    token_linked_together.push(false)
                    token_num_name_codes.push(t.num_name_codes)
                    token_num_tore_codes.push(t.num_tore_codes)
                }
            }
            state.token_in_selected_code = token_in_selected_code;
            state.token_linked_together = token_linked_together;
            state.token_num_name_codes = token_num_name_codes;
            state.token_num_tore_codes = token_num_tore_codes;
        },

        setTokensInSelectedCode(state, [lastSelectedCode, selectedCode]){

            let lastWasNull = lastSelectedCode=== null;
            let newIsNull = selectedCode === null;

            let lastSelectedTokens = lastWasNull ? [] : lastSelectedCode.tokens;
            let newSelectedTokens = newIsNull ? [] : selectedCode.tokens;

            for(let lastToken of lastSelectedTokens){
                Vue.set(state.token_in_selected_code, lastToken, false);
            }
            for(let newToken of newSelectedTokens){
                Vue.set(state.token_in_selected_code, newToken, true);
            }
        },

        updateLastAnnotationEditAt(state){
            state.lastAnnotationEditAt = Date.now()
        },

        resetAnnotator(state){
            state.isLoadingAvailableAnnotations = false;
            state.isLoadingAnnotation = false;
            state.selected_algo_result = null;
            state.lastAnnotationEditAt = null;
            state.lastAnnotationPostAt = null;

            state.annotator_dataset = null;
            state.annotator_uploaded_at = null;
            state.selected_annotation = null;
            state.selected_doc = null;
            state.selected_pos_tags = []
            state.selected_algo_result = null
            state.annotatorViewingCodeResults = false

            state.tokens = []
            state.docs = []
            state.codes = []
            state.tore_relationships = []

            this.commit("initTokensEfficiencyStructs", true)
        },

        setIsLoadingAnnotation(state, isLoading){
            state.isLoadingAnnotation = isLoading
        },

        setIsLoadingAvailableAnnotations(state, isLoading){
            state.isLoadingAvailableAnnotations = isLoading
        },

        postAnnotationCallback(state){
            state.lastAnnotationPostAt = Date.now()
        },

        setAvailableAnnotations(state, annotations){
            state.available_annotations = annotations;
            this.commit("setIsLoadingAvailableAnnotations", false);
        },
        // eslint-disable-next-line no-unused-vars
        updateDocTokens(state){
            /*
            console.warn("updateDocTokens")
            let docTokens = state.tokens?state.tokens.slice(state.selected_doc.begin_index, state.selected_doc.end_index):[]
            /*for(let t of docTokens){
                Object.freeze(t)  FIXME
            }
            Object.freeze(docTokens)
            state.doc_tokens = docTokens*/
        },

        setAnnotationPayload(state, {name, tokens, codes, tore_relationships, docs, uploaded_at, dataset}){
            state.annotator_uploaded_at = uploaded_at;
            state.annotator_dataset = dataset;

            for(let token of tokens){
                Object.freeze(token);
            }
            Object.freeze(tokens);  // performance boost

            state.tokens = tokens;
            this.commit("initTokensEfficiencyStructs", false)

            state.codes = codes;
            state.tore_relationships = tore_relationships;
            let newDocs = [state.all_docs].concat(docs);
            state.all_docs.end_index = tokens.length;
            for (let doc of newDocs){
                Object.freeze(doc)
            }
            Object.freeze(newDocs)
            state.docs = newDocs
            state.selected_doc = newDocs[docs.length > 0 ? 1: 0];  // document indices from the server start at 1!

            state.selected_annotation = name;
            this.commit("setIsLoadingAnnotation", false);
        },

        /**
         * @param state
         * @param tore_relationship
         * @param name
         */
        setRelationshipName(state, name){
            TORERelationship_set_relationship_name(state.selected_tore_relationship, name);
        },

        /**
         * @param state
         * @param tore_relationship
         */
        delete_tore_relationship(state, tore_relationship){

            Code_remove_relationship(state.codes[tore_relationship.TOREEntity], tore_relationship);

            Vue.set(state.tore_relationships, tore_relationship.index, null);

            if(state.selected_tore_relationship && state.selected_tore_relationship.index === tore_relationship.index){
                this.commit("setSelectedToreRelationship", null);
            }
        },

        /**
         * Created a new code relationship and adds the currently selected code to it
         * linker should already be open and tokens selected
         * @param state
         * @param firstToken initial token, more may follow
         */
        new_tore_relationship(state, firstToken){
            console.log("new_tore_relationship for selected code: "+CodeToString(state.selected_code))
            let relationship = new TORERelationship(state.selected_code, [firstToken.index], state.tore_relationships.length);
            Code_add_relationship(state.selected_code, relationship)
            this.commit("setSelectedToreRelationship", relationship);
            state.tore_relationships.push(relationship);
        },

        add_or_remove_token_selected_relationship(state, token){
            console.log("Adding/Removing token: ... to current relationship: "+state.selected_tore_relationship.index)
            if(state.selected_tore_relationship === null){
                console.error("add_or_remove_token_selected_relationship called while selected tore relationship is null")
            } else {
                //console.log(state.selected_tore_relationship.target_tokens)

                for(let token_index of state.selected_tore_relationship.target_tokens){
                    Vue.set(state.token_linked_together, token_index, false);
                }

                if(!TORERelationship_add_token(state.selected_tore_relationship, token)){
                    TORERelationship_remove_token(state.selected_tore_relationship, token)
                }
                for(let token_index of state.selected_tore_relationship.target_tokens){
                    Vue.set(state.token_linked_together, token_index, true);
                }
                //console.log(state.selected_tore_relationship.target_tokens)
            }
        },

        setIsLinking(state, isLinking){
            state.isLinking = isLinking;
            if(!isLinking){
                this.commit("setSelectedToreRelationship", null)
            }
        },

        delete_code(state, code){
            if(!code){
                console.error("delete_code attempted to delete null/undefined code");
                return;
            }
            if(code.index===null || code.index === undefined){
                console.error("delete_code attempted to delete code without index");
                return;
            }

            code = state.codes[code.index];

            let isSelectedCode = state.selected_code?code.index === state.selected_code.index : false;

            let token_indices = code.tokens;
            let index = code.index;

            for(let i of code.relationship_memberships){
                this.commit("delete_tore_relationship", state.tore_relationships[i]);  // relationships are dependent upon tore codes
                this.commit("updateLastAnnotationEditAt")
            }

            let codeName = code.name;
            let codeTore = code.tore;

            if(isSelectedCode){
                this.commit("setTokensInSelectedCode", [state.selected_code, null]);
                state.selected_code = null;
            }

            for(let i of token_indices){
                /*
                let newToken = {...state.tokens[i]}
                let newTokens = [...state.tokens]
                newToken.num_codes--;
                newTokens[i] = newToken
                Object.freeze(newTokens)
                state.tokens = newTokens
                this.commit("updateDocTokens")*/
                // state.tokens[i].num_codes--; FIXME use helper data structure
                if(codeName){
                    state.token_num_name_codes[i]--;
                }

                if(codeTore){
                    state.token_num_tore_codes[i]--;
                }
            }
            Vue.set(state.codes, index, null);
        },

        delete_selected_code(state){
            this.commit("delete_code",state.selected_code);
        },

        setAnnotatorInputVisible(state, visible){
            //console.log("setAnnotatorInputVisible: "+visible)
            state.annotatorInputVisible = visible;
            if(!visible){
                state.isLinking = false;
                state.selectedToken = null;
                this.commit("setTokensInSelectedCode", [state.selected_code, null]);
                state.selected_code = null;
                this.commit("setSelectedToreRelationship", null);
            }
        },

        set_selected_code(state, code){
            console.log("Set selected code: "+CodeToString(code))
            this.commit("setTokensInSelectedCode", [state.selected_code, code]);
            state.selected_code = code;
        },

        /*
        setHoveringToken(state, token){
            //console.log("vuex setHoveringToken")
            // notify token changes
            if(state.hoveringToken !== null){
                Vue.set(state.token_is_hovering_token, state.hoveringToken.index, false)
            }
            if(token !== null){
                Vue.set(state.token_is_hovering_token, token.index, true)
            }

            state.hoveringToken = token;

            // notify hovering code changes
            let hovering_codes = []
            if(token !== null){
                let ind = token.index;
                if(state.token_num_name_codes[ind] > 0  || state.token_num_tore_codes[ind] > 0){   // better than filtering because we terminate search asap
                    let remaining_name_codes = state.token_num_name_codes[ind];
                    let remaining_tore_codes = state.token_num_tore_codes[ind];

                    for(let code of state.codes){
                        if(code === null){
                            continue;
                        }
                        if(code.tokens.includes(ind)){
                            hovering_codes.push(code)
                            if(code.name){
                                remaining_name_codes--;
                            }
                            if(code.tore){
                                remaining_tore_codes--;
                            }
                        }
                        if(remaining_name_codes <= 0 && remaining_tore_codes <= 0){
                            break;
                        }
                    }
                }
            }

            for(let code of state.hovering_codes){
                for(let token_index of code.tokens){
                    Vue.set(state.token_is_hovering_code, token_index, false)  // old tokens no longer in hovering code
                }
            }
            for(let code of hovering_codes){
                for(let token_index of code.tokens){
                    Vue.set(state.token_is_hovering_code, token_index, true)  // new tokens are in hovering code
                }
            }

            state.hovering_codes = hovering_codes;
        },*/

        setSelectedToken(state, token){
            //console.log("Selected token is: "+token)
            state.selectedToken = token;
        },

        /**
         * @param state
         * @param args
         */
        assignToCode(state, args){
            const {token, code, new_code} = args;
            console.log("Adding token: "+token.name+" with index: "+token.index+" to code: "+CodeToString(code)+". New code: "+new_code)
            Code_update_token(state, this.commit, code, token);
            //console.log("Resulting token: "+TokenToString(token))
            if(new_code){
                state.codes.push(code);
            }
        },

        updateCodeName(state, name){
            console.log("Update selected code name: "+name)
            let beforeName = state.selected_code.name;
            state.selected_code.name = name;
            if(name && !beforeName){
                for(let t_index of state.selected_code.tokens){
                    state.token_num_name_codes[t_index]++;
                }
            } else if(!name && beforeName){
                for(let t_index of state.selected_code.tokens){
                    state.token_num_name_codes[t_index]--;
                }
            }
        },

        updateCodeTore(state, tore){
            let beforeTore = state.selected_code.tore;
            state.selected_code.tore = tore;
            if(tore && !beforeTore){
                for(let t_index of state.selected_code.tokens){
                    state.token_num_tore_codes[t_index]++;
                }
            } else if(!tore && beforeTore){
                for(let t_index of state.selected_code.tokens){
                    state.token_num_tore_codes[t_index]--;
                }
            }
        },

        setSelectedToreRelationship(state, relationship) {
            console.log("Setting selected relationship: "+(relationship===null?'null':relationship.index))

            if(state.selected_tore_relationship !== null){
                for(let token_index of state.selected_tore_relationship.target_tokens){
                    Vue.set(state.token_linked_together, token_index, false);
                }
            }

            if(relationship !== null){
                for(let token_index of relationship.target_tokens){
                    Vue.set(state.token_linked_together, token_index, true);
                }
            }
            state.selected_tore_relationship = relationship;
        },

        updateSelectedDoc: (state, value) => {
            state.selected_doc = value;
        },

        updateSelectedAlgoResult: (state, value) => {
            state.selected_algo_result = value;
        },

        updateSelectedPosTags: (state, value) => {
            state.selected_pos_tags = value;
        },

        updateSelectedAnnotation: (state, value) => {
            state.selected_annotation = value;
        }

    }
})

export default store;