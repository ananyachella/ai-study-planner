<<<<<<< HEAD
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
=======
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
>>>>>>> 5095371b73410f173a25e975ba85a1b541e5fc48

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
})
=======
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
>>>>>>> 5095371b73410f173a25e975ba85a1b541e5fc48
