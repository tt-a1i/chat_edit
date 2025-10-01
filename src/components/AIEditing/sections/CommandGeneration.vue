<script setup lang="ts">
// Add your command generation logic here
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Command Generation</h1>
    <p class="text-gray-600 dark:text-gray-400">
      Generate shell commands for various tasks using AI.
    </p>
    
    <div class="mt-6 rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <h2 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">Command Generator</h2>
      <!-- Your command generator implementation will go here -->
      <div class="space-y-4">
        <textarea
          class="w-full rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          rows="4"
          placeholder="Describe what you want to do..."
        ></textarea>
        
        <div class="rounded-md bg-gray-100 p-4 dark:bg-gray-800">
          <pre class="text-sm text-gray-800 dark:text-gray-200"># Generated command will appear here</pre>
        </div>
      </div>
    </div>
  </div>
</template>
