// import { ChangelogFunctions } from "@changesets/types";
// @ts-ignore
// import { config } from "dotenv";
// import { getInfo, getInfoFromPullRequest } from "@changesets/get-github-info";
require("dotenv").config();
const {
  getInfo,
  getInfoFromPullRequest,
} = require("@changesets/get-github-info");
const spawn = require("spawndamnit");
const { getPackages } = require("@manypkg/get-packages");
const path = require("path");

const changelogFunctions = {
  getDependencyReleaseLine: async (
    changesets,
    dependenciesUpdated,
    options
  ) => {
    // console.log(
    //   "getDependencyReleaseLine",
    //   changesets,
    //   dependenciesUpdated,
    //   options
    // );
    if (!options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@changesets/changelog-github", { "repo": "org/repo" }]'
      );
    }
    if (dependenciesUpdated.length === 0) return "";

    // return "";

    const changesetLink = `- Updated dependencies [${(
      await Promise.all(
        changesets.map(async (cs) => {
          if (cs.commit) {
            let { links } = await getInfo({
              repo: options.repo,
              commit: cs.commit,
            });
            return links.commit;
          }
        })
      )
    )
      .filter((_) => _)
      .join(", ")}]:`;

    const updatedDepenenciesList = dependenciesUpdated.map(
      (dependency) => `  - ${dependency.name}@${dependency.newVersion}`
    );

    return [changesetLink, ...updatedDepenenciesList].join("\n");
  },
  getReleaseLine: async (changeset, type, options) => {
    if (!options || !options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@changesets/changelog-github", { "repo": "org/repo" }]'
      );
    }

    console.log("getReleaseLine", changeset, type, options);

    // let prFromSummary: number | undefined;
    // let commitFromSummary: string | undefined;
    // let usersFromSummary: string[] = [];

    let prFromSummary;
    let commitFromSummary;
    let usersFromSummary = [];

    const replacedChangelog = changeset.summary
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

    console.log("replacedChangelog", replacedChangelog);

    const [firstLine, ...futureLines] = replacedChangelog
      .split("\n")
      .map((l) => l.trimRight());

    console.log("first line", firstLine);
    console.log("prFromSummary", prFromSummary);
    console.log("commitFromSummary", commitFromSummary);
    console.log("usersFromSummary", usersFromSummary);

    // const links = await (async () => {
    //   if (prFromSummary !== undefined) {
    //     let { links } = await getInfoFromPullRequest({
    //       repo: options.repo,
    //       pull: prFromSummary,
    //     });
    //     if (commitFromSummary) {
    //       const shortCommitId = commitFromSummary.slice(0, 7);
    //       links = {
    //         ...links,
    //         commit: `[\`${shortCommitId}\`](https://github.com/${options.repo}/commit/${commitFromSummary})`,
    //       };
    //     }
    //     return links;
    //   }
    //   const commitToFetchFrom = commitFromSummary || changeset.commit;
    //   console.log("commitToFetchFrom", commitToFetchFrom);
    //   if (commitToFetchFrom) {
    //     let info = await getInfo({
    //       repo: options.repo,
    //       commit: commitToFetchFrom,
    //     });
    //     const { links } = info;
    //     console.log(
    //       "commitToFetchFrom, links\n\n\n",
    //       JSON.stringify(info, undefined, 2)
    //     );
    //     return links;
    //   }
    //   return {
    //     commit: null,
    //     pull: null,
    //     user: null,
    //   };
    // })();
    const commit = changeset.commit;
    const { stdout } = await spawn(
      "git",
      ["log", '--pretty=format:"%H - %s"'],
      {
        cwd: process.cwd(),
      }
    );

    const commits = stdout
      .toString()
      .split("\n")
      .map((row) => {
        const match = row.match(/([a-f0-9]{40}) - (.*)/);
        return { commit: match[1], message: match[2] };
      });

    const { packages } = await getPackages(process.cwd());

    console.log("packages", packages);

    changeset.releases.map((release) => {
      const name = release.name;
      const package = packages.find((p) => p.packageJson.name === name);
      if (!package) {
        throw new Error(`cannot find package ${name}`);
      }
      const dir = path.basename(package.dir);
      let findCommit = false;

      const before = [];

      commits.forEach((row) => {
        if (row.commit === commit) {
          findCommit = true;
          console.log("找到了 commit", row.commit, row.message);
          return;
        }
        const re = new RegExp(
          `^(feat|fix|perf|docs|style|refactor|test|chore)\\(${dir}\\):.*`
        );
        if (findCommit) {
          console.log("row", row.message);
        }
        if (findCommit && re.test(row.message)) {
          before.push(row);
        }
        if (row.message.startsWith("chore: changeset")) {
          findCommit = false;
        }
      });

      console.log("before\n\n", JSON.stringify(before, undefined, 2));
    });

    const users = usersFromSummary.length
      ? usersFromSummary
          .map(
            (userFromSummary) =>
              `[@${userFromSummary}](https://github.com/${userFromSummary})`
          )
          .join(", ")
      : links.user;

    const prefix = [
      links.pull === null ? "" : ` ${links.pull}`,
      links.commit === null ? "" : ` ${links.commit}`,
      users === null ? "" : ` Thanks ${users}!`,
    ].join("");

    return `\n\n-${prefix ? `${prefix} -` : ""} ${firstLine}\n${futureLines
      .map((l) => `  ${l}`)
      .join("\n")}`;
  },
};

module.exports = changelogFunctions;

// export default changelogFunctions;
