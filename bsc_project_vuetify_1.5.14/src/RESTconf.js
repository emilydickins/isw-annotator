
export const BASE_URL = `http://127.0.0.1:9661`;
export const GET_EXAMPLE_AGREEMENT_POST_ENDPOINT = BASE_URL+`/hitec/agreement/tokenize/`;

export const AGREEMENT_POST_ENDPOINT = `${BASE_URL}/hitec/repository/concepts/store/agreement/`
;
export const AGREEMENT_GET_ENDPOINT = function(name){
    return `${BASE_URL}/hitec/repository/concepts/agreement/name/${encodeURIComponent(name)}`
};
export const AGREEMENT_GET_ALL_ENDPOINT = `${BASE_URL}/hitec/repository/concepts/agreement/all`

export const AGREEMENT_DELETE_ENDPOINT = function (name) {
    return `${BASE_URL}/hitec/repository/concepts/agreement/name/${encodeURIComponent(name)}`
}

export const AGREEMENT_STATUS_ENDPOINT = `${BASE_URL}/hitec/agreement/status`

export const GET_ALL_RELATIONSHIPS_ENDPOINT = `${BASE_URL}/hitec/repository/concepts/agreement/relationships`

export const GET_ALL_TORES_ENDPOINT = `${BASE_URL}/hitec/repository/concepts/agreement/tores`


export const POST_ALL_RELATIONSHIPS_ENDPOINT = `${BASE_URL}/hitec/repository/concepts/store/agreement/relationships/`
export const POST_ALL_TORES_ENDPOINT = `${BASE_URL}/hitec/repository/concepts/store/agreement/tores/`