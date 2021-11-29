<template>
  <v-app>
    <Annotator/>
  </v-app>
</template>

<script>
import Annotator from './components/annotator/Annotator';

export default {
  name: 'App',

  components: {
    Annotator,
  },

  data: () => ({
    //
  }),
};
</script>
