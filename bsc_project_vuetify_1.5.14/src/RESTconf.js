
export const BASE_URL = `http://127.0.0.1:9661`;
export const GET_EXAMPLE_ANNOTATION_POST_ENDPOINT = BASE_URL+`/hitec/annotation/tokenize/`;

export const ANNOTATION_POST_ENDPOINT = `${BASE_URL}/hitec/repository/concepts/store/annotation/`
;
export const ANNOTATION_GET_ENDPOINT = function(name){
    return `${BASE_URL}/hitec/repository/concepts/annotation/name/${encodeURIComponent(name)}`
};
export const ANNOTATION_GET_ALL_ENDPOINT = `${BASE_URL}/hitec/repository/concepts/annotation/all`

export const ANNOTATION_DELETE_ENDPOINT = function (name) {
    return `${BASE_URL}/hitec/repository/concepts/annotation/name/${encodeURIComponent(name)}`
}

export const ANNOTATOR_STATUS_ENDPOINT = `${BASE_URL}/hitec/annotation/status`

export const GET_ALL_RELATIONSHIPS_ENDPOINT = `${BASE_URL}/hitec/repository/concepts/annotation/relationships`

export const GET_ALL_TORES_ENDPOINT = `${BASE_URL}/hitec/repository/concepts/annotation/tores`


export const POST_ALL_RELATIONSHIPS_ENDPOINT = `${BASE_URL}/hitec/repository/concepts/store/annotation/relationships/`
export const POST_ALL_TORES_ENDPOINT = `${BASE_URL}/hitec/repository/concepts/store/annotation/tores/`