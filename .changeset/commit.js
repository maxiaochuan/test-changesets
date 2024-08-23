const { exec } = require("child_process");

const commit = "d69eccb47754bfa6e79b7ed9b47bb23ac8a698fa";

// 指定你的 Git 仓库路径
const repoPath = "/Users/maxiaochuan/workspace/study/test-changesets"; // 替换为你的仓库路径

// 命令用于获取所有的提交信息
const command = 'git log --pretty=format:"%H - %s"';

exec(command, { cwd: repoPath }, (error, stdout, stderr) => {
  if (error) {
    console.error(`执行错误: ${error}`);
    return;
  }

  if (stderr) {
    console.error(`错误输出: ${stderr}`);
    return;
  }

  // 输出获取的提交信息
  // console.log("提交信息:\n", stdout);

  const rows = stdout.split("\n").map((row) => {
    const match = row.match(/([a-f0-9]{40}) - (.*)/);
    return { commit: match[1], message: match[2] };
  });

  let findCommit = false;

  const before = [];

  console.log("rows", stdout);

  rows.forEach((row) => {
    if (row.commit === commit) {
      findCommit = true;
      console.log("找到了 commit", row.commit, row.message);
      return;
    }
    if (findCommit && row.message.startsWith("feat(ui):")) {
      before.push(row);
    }
    if (row.message.startsWith("chore: changeset")) {
      console.log("findCommit = false;");
      findCommit = false;
    }
  });

  console.log("before:\n\n", JSON.stringify(before, undefined, 2));
});
