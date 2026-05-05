# Git 命令学习笔记 —— 从零到推送 GitHub

> 场景：本地有一个项目目录，需要提交到 GitHub 远程仓库。

---

## 1. 初始化本地 Git 仓库

```bash
git init
```

把当前目录变成 Git 仓库，Git 会在目录下创建 `.git` 隐藏文件夹来跟踪所有变更。

---

## 2. 重命名默认分支为 `main`

```bash
git branch -m main
```

`git init` 默认分支名是 `master`，现在社区主流是 `main`，所以改名。

> 也可以一劳永逸设置全局默认分支名：
> ```bash
> git config --global init.defaultBranch main
> ```

---

## 3. 配置提交者身份（仅本仓库）

```bash
git config user.name "LLLiuSSSsai"
git config user.email "wenqinliu375@gmail.com"
```

每次 commit 都需要署名。不加 `--global` 表示只对当前仓库生效。

> 设置全局身份（所有仓库生效）：
> ```bash
> git config --global user.name "Your Name"
> git config --global user.email "your@email.com"
> ```

---

## 4. 暂存所有文件

```bash
git add .
```

把当前目录下所有文件加入「暂存区」（staging area），准备提交。

> `.gitignore` 中列出的文件（如 `node_modules/`、`dist/`）不会被加入。

---

## 5. 查看暂存区状态

```bash
git status
```

显示哪些文件已暂存、哪些未暂存、哪些未被跟踪。提交前最好看一眼，确认没有漏掉或误加文件。

---

## 6. 提交到本地仓库

```bash
git commit -m "Initial commit: DeepFakeAgent frontend with detection UI"
```

把暂存区的内容永久记录到本地 Git 历史中。`-m` 后面是提交信息。

---

## 7. 关联远程仓库

```bash
git remote add origin https://github.com/LLLiuSSSsai/DeepFakeAgent.git
```

给远程仓库起个名字叫 `origin`（习惯命名），以后 `push` / `pull` 就知道往哪推、从哪拉。

> 查看已关联的远程仓库：
> ```bash
> git remote -v
> ```

---

## 8. 检查远程仓库内容

```bash
git ls-remote origin
```

列出远程仓库的分支和标签，用于确认远程是否为空、是否有冲突。

---

## 9. 推送到 GitHub

```bash
git push -u origin main
```

把本地 `main` 分支推送到 `origin` 远程仓库。`-u`（`--set-upstream`）让本地分支「追踪」远程分支，之后只需要 `git push` 即可。

---

## 附：GitHub CLI 操作

```bash
# 检查 GitHub 登录状态
gh auth status

# 创建 GitHub 仓库并推送（一条龙）
gh repo create DeepFakeAgent --source=. --remote=origin --public --push

# 如果仓库已存在，会报错，此时手动添加 remote 再 push 即可
```

---

## 日常工作流汇总

```bash
# 修改代码后...
git status              # 看看改了哪些文件
git add <file>          # 暂存指定文件（或用 git add . 暂存全部）
git commit -m "xxx"     # 提交
git push                # 推送（已设置 upstream 的情况下）
```

---

## 常用技巧

```bash
# 查看提交历史
git log --oneline

# 查看某次提交的详细变更
git show <commit-hash>

# 撤销暂存（add 的反操作）
git restore --staged <file>

# 丢弃工作区的修改
git restore <file>

# 查看工作区和暂存区的差异
git diff

# 查看暂存区和最新 commit 的差异
git diff --staged
```
