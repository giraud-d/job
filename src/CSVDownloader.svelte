<!--
Fork from https://github.com/Bunlong/svelte-csv
"svelte-csv": "^1.2.0"
Cause can not apply class on child component (button)
-->

<script>
  import PapaParse from 'papaparse';
  export let data;
  export let filename = 'filename';
  export let type = 'link';
  export let bom = 2;
  function download (data, filename, bom) {
    const bomCode = bom ? '\ufeff' : '';
    let csvContent = null;
    if (typeof data === 'object') {
      csvContent = PapaParse.unparse(data);
    } else {
      csvContent = data;
    }
    const csvData = new Blob([`${bomCode}${csvContent}`], {
      type: 'text/csv;charset=utf-8;',
    });
    let csvURL = null;
    if (navigator.msSaveBlob) {
      csvURL = navigator.msSaveBlob(csvData, `${filename}.csv`);
    } else {
      csvURL = window.URL.createObjectURL(csvData);
    }
    const link = document.createElement('a');
    link.href = csvURL;
    link.setAttribute('download', `${filename}.csv`);
    link.click();
    link.remove();
  }
</script>

<button class="btn btn-outline-primary" on:click={download(data, filename, bom)}>
    <slot></slot>
</button>

