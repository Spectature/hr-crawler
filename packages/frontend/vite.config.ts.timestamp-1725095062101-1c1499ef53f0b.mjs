// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import Components from "file:///D:/WebstormProjects/hr-crawler/packages/frontend/node_modules/.pnpm/unplugin-vue-components@0.27.4_@babel+parser@7.25.6_rollup@4.21.2_vue@3.4.38_typescript@5.4.5_/node_modules/unplugin-vue-components/dist/vite.js";
import AntdvResolver from "file:///D:/WebstormProjects/hr-crawler/packages/frontend/node_modules/.pnpm/antdv-component-resolver@1.0.7_unplugin-vue-components@0.27.4_@babel+parser@7.25.6_rollup@4.2_sgfzaq4ytpyc4xw524ps46rqua/node_modules/antdv-component-resolver/dist/index.mjs";
import { defineConfig } from "file:///D:/WebstormProjects/hr-crawler/packages/frontend/node_modules/.pnpm/vite@5.4.2_@types+node@20.16.2/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/WebstormProjects/hr-crawler/packages/frontend/node_modules/.pnpm/@vitejs+plugin-vue@5.1.3_vite@5.4.2_@types+node@20.16.2__vue@3.4.38_typescript@5.4.5_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///D:/WebstormProjects/hr-crawler/packages/frontend/vite.config.ts";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [AntdvResolver()]
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxXZWJzdG9ybVByb2plY3RzXFxcXGhyLWNyYXdsZXJcXFxccGFja2FnZXNcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFdlYnN0b3JtUHJvamVjdHNcXFxcaHItY3Jhd2xlclxcXFxwYWNrYWdlc1xcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovV2Vic3Rvcm1Qcm9qZWN0cy9oci1jcmF3bGVyL3BhY2thZ2VzL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy92aXRlJ1xuaW1wb3J0IEFudGR2UmVzb2x2ZXIgZnJvbSAnYW50ZHYtY29tcG9uZW50LXJlc29sdmVyJ1xuXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG4gICAgQ29tcG9uZW50cyh7XG4gICAgICByZXNvbHZlcnM6IFtBbnRkdlJlc29sdmVyKCldXG4gICAgfSlcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKVxuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFUsU0FBUyxlQUFlLFdBQVc7QUFDL1csT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxtQkFBbUI7QUFFMUIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTO0FBTGlNLElBQU0sMkNBQTJDO0FBUWxRLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxJQUNKLFdBQVc7QUFBQSxNQUNULFdBQVcsQ0FBQyxjQUFjLENBQUM7QUFBQSxJQUM3QixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxjQUFjLElBQUksSUFBSSxTQUFTLHdDQUFlLENBQUM7QUFBQSxJQUN0RDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
