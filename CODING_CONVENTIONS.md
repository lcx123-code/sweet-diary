# Sweet Diary — 编码约定

## 1. Store 只存纯 JSON

**规则：** Zustand store 只存储 `interface` 定义的纯 JSON 对象，**不存 SDK 或库返回的实例**。

```ts
// ❌ Bad — Supabase User 含 Symbol 内部属性
import type { User } from '@supabase/supabase-js'
user: User | null

// ✅ Good — 自定义纯接口，只存需要的字段
interface UserInfo { id: string; email: string; name: string }
user: UserInfo | null
```

**原则：** 任何 `set()` 调用传入的值，应该能被 `JSON.parse(JSON.stringify(value))` 无损往返。

## 2. 导入 SDK 类型时提高警惕

以下类型已知可能含 Symbol / 不可序列化属性：

| 库 | 危险类型 | 替代方案 |
|---|---------|---------|
| `@supabase/supabase-js` | `User`, `Session` | 自定义 `UserInfo` |
| `@supabase/supabase-js` | `AuthResponse` | 只取 `.data` 中的纯字段 |

## 3. 新加状态后的检查清单

每新增一个 store 或往 store 加新字段后：
- [ ] 该值是 SDK 实例吗？→ 改存纯 JSON
- [ ] 该值含 function / Symbol 吗？→ 改存纯 JSON
- [ ] 在真机上跑一次涉及该值的完整流程

## 4. 提交前检查

```bash
npx expo export --platform web --no-minify  # 检查 bundle 错误
# 或
node -e "
const ts=require('typescript');
const c=ts.readConfigFile('tsconfig.json',ts.sys.readFile);
const p=ts.parseJsonConfigFileContent(c.config,ts.sys,'.');
p.options.noEmit=true;p.options.skipLibCheck=true;
p.fileNames=p.fileNames.filter(f=>!f.includes('node_modules'));
const prog=ts.createProgram(p.fileNames,p.options);
const d=ts.getPreEmitDiagnostics(prog);
d.length===0?console.log('OK'):d.forEach(x=>console.log(ts.formatDiagnostic(x,...)))
"
```

## 5. 路由约定

- 条件渲染根路由时，**不要直接传递 SDK 对象做判断**
  ```tsx
  // ❌ Bad — user 可能是含 Symbol 的对象
  {user ? <Stack.Screen name="(tabs)" /> : <Stack.Screen name="(auth)" />}
  
  // ✅ Good — 用纯布尔值
  const isLoggedIn = !!user?.id
  {isLoggedIn ? <Stack.Screen name="(tabs)" /> : <Stack.Screen name="(auth)" />}
  ```
