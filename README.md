# MADORI

ブラウザだけで間取りを作成し、PNG画像として保存できる静的Webサイトです。

## GitHub Pagesで公開する

このリポジトリにはGitHub Pages用のデプロイワークフローが含まれています。次の手順で公開できます。

1. リポジトリをGitHubへpushします。
2. GitHubのリポジトリ画面で **Settings → Pages** を開きます。
3. **Build and deployment** の **Source** に **GitHub Actions** を選択します。
4. `main` または `work` ブランチへpushするか、**Actions → Deploy to GitHub Pages → Run workflow** を実行します。
5. デプロイ完了後、Actionsの実行結果または **Settings → Pages** に表示されるURLへアクセスします。

通常、プロジェクトサイトのURLは次の形式です。

```text
https://<ユーザー名>.github.io/<リポジトリ名>/
```

サイト内のCSSとJavaScriptは相対パスで参照しているため、ユーザーサイトとプロジェクトサイトのどちらでも利用できます。

## ローカルで確認する

```bash
python3 -m http.server 8000
```

起動後、ブラウザで <http://localhost:8000> を開いてください。
