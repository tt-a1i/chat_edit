#!/bin/bash
# Git Hooks 示例脚本
#
# 当前项目使用直接的 .git/hooks/pre-commit
# 如果未来需要团队共享 hooks，可以迁移到 husky

# 安装 husky 的步骤（可选）：
#
# 1. 安装依赖
# pnpm add -D husky lint-staged
#
# 2. 初始化 husky
# pnpm exec husky init
#
# 3. 配置 package.json
# {
#   "scripts": {
#     "prepare": "husky"
#   },
#   "lint-staged": {
#     "*.{ts,tsx,vue}": [
#       "eslint --fix",
#       "git add"
#     ]
#   }
# }
#
# 4. 创建 pre-commit hook
# echo "pnpm lint-staged && pnpm typecheck" > .husky/pre-commit
test
