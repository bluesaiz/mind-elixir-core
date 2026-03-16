我将把 `main_my` 分支中的节点类型功能移植到当前的 `master` 分支。该实现涉及类型定义、样式、DOM 操作和事件处理的更新。

### 1. 类型定义 (`src/types/index.ts`)
*   更新 `NodeObj` 接口，增加可选的 `type` 字段。
*   更新 `Options` 接口，增加 `nodeTypes` 配置项。
*   更新 `MindElixirInstance` 接口，增加 `nodeTypes`, `NodeTypeClassMap`, `typeSelectDiv`, 和 `createNodeTypeSelect`。

### 2. 国际化 (`src/i18n.ts`)
*   在 CN, TW, 和 EN 语言包中添加 "选择节点类型" (`selectNodeType`) 的翻译。

### 3. 样式 (`src/index.less`)
*   添加节点类型标签 (`.me-node-type`) 的样式。
*   添加节点类型选择器弹窗 (`#type-select-box`) 的样式。
*   添加特定节点类型的样式类 (如 `.m-node-module`, `.m-node-expect` 等)。

### 4. 核心逻辑与 DOM (`src/index.ts`, `src/utils/dom.ts`)
*   **初始化**: 在 `MindElixir` 构造函数 (`src/index.ts`) 中，初始化 `this.nodeTypes` 并从选项构建 `this.NodeTypeClassMap`。
*   **渲染**: 更新 `src/utils/dom.ts` 中的 `shapeTpc` 方法：
    *   如果节点有类型，渲染一个 `span.me-node-type`。
    *   确保主题文本被包裹在 `span.text` 中（利用现有逻辑，但需确保兼容性）。
*   **选择器 UI**: 在 `src/utils/dom.ts` 中实现 `createNodeTypeSelect` 方法，用于创建和处理类型选择弹窗。
    *   它将列出所有可用的类型。
    *   选择后，更新节点的类型，触发操作事件，并可选择性地触发文本编辑。
*   **输入处理**: 验证 `createInputDiv` 能正确读取/写入 `span.text` 中的文本（它已经这样做了，但我们要确保它忽略类型标签）。

### 5. 事件处理 (`src/mouse.ts`)
*   更新 `handleClick`:
    *   增加检测对 `.me-node-type` 点击的逻辑。如果点击，选中节点并打开类型选择器。
    *   确保点击 `.text` 能选中节点。

### 6. 右键菜单 (`src/plugin/contextMenu.ts`)
*   在右键菜单中添加 "选择节点类型" 选项。
*   绑定点击事件到 `mind.createNodeTypeSelect()`。

### 7. 节点操作 (`src/nodeOperation.ts`)
*   更新 `addChild`, `insertSibling`, 和 `insertParent` 方法，改为调用 `this.createNodeTypeSelect(..., true)`，而不是直接调用 `createInputDiv`。这模仿了 `main_my` 的行为，即添加节点时首先提示选择类型。
