<template>
  <v-app>
    <Agreement/>
  </v-app>
</template>

<script>
import Agreement from './components/agreement/Agreement';

export default {
  name: 'App',

  components: {
    Agreement,
  },

  data: () => ({
    //
  }),
};
</script>
