let commitFromSummary;
let usersFromSummary = [];
const replacedChangelog = "UI \n commit:asdf][;lkj]"
  .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
    let num = Number(pr);
    if (!isNaN(num)) prFromSummary = num;
    return "";
  })
  .replace(/^\s*commit:\s*([^\s]+)/im, (_, commit) => {
    commitFromSummary = commit;
    return "";
  })
  .replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, (_, user) => {
    usersFromSummary.push(user);
    return "";
  })
  .trim();

const [firstLine, ...futureLines] = replacedChangelog
  .split("\n")
  .map((l) => l.trimEnd());

console.log(
  "replacedChangelog",
  replacedChangelog,
  firstLine,
  futureLines,
  commitFromSummary,
  usersFromSummary
);
