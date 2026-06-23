const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('Node.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Import NodeMetricsAlerts
      if (!content.includes('NodeMetricsAlerts')) {
        content = content.replace(
          /(import .* from "@\/lib\/utils";?)/,
          "$1\nimport { NodeMetricsAlerts } from \"./SharedPrimitives\";"
        );
        // Fallback for cloud nodes which might have different paths
        content = content.replace(
          /(import .* from "@\/lib\/utils";?)\n(?!.*NodeMetricsAlerts)/,
          "$1\nimport { NodeMetricsAlerts } from \"../SharedPrimitives\";"
        );
      }

      // Add id to destructured props
      if (content.match(/data,\s*selected,\s*}: NodeProps<SystemNode>/)) {
        content = content.replace(
          /data,\s*selected,\s*}: NodeProps<SystemNode>/,
          "id,\n  data,\n  selected,\n}: NodeProps<SystemNode>"
        );
      }

      // Add <NodeMetricsAlerts nodeId={id} /> right after the opening div (which contains relative class)
      if (!content.includes('<NodeMetricsAlerts')) {
        content = content.replace(
          /(<div[^>]*className=\{cn\([^>]*"relative[^>]*>\s*)/,
          "$1<NodeMetricsAlerts nodeId={id} />\n      "
        );
      }
      
      fs.writeFileSync(fullPath, content);
      console.log('Fixed', file);
    }
  }
}

processDir(path.join(__dirname, 'src/components/nodes'));
