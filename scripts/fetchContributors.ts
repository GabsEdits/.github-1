import { writeFile } from "node:fs/promises";

type Repo = {
  name: string;
  contributors_url: string;
};

type Contributor = {
  id: number;
  login: string;
};

type UserDetails = {
  id: number;
  name: string | null;
  login: string;
};

async function fetchData<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${process.env.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

async function fetchContributorsData(): Promise<void> {
  const contributors: { id: number; name: string; login: string }[] = [];

  try {
    console.log("Fetching organization repositories...");
    const orgReposData = await fetchData<Repo[]>(
      "https://api.github.com/orgs/Vanilla-OS/repos"
    );

    for (const repo of orgReposData) {
      console.log(`Getting data for repository ${repo.name}...`);
      const contributorsData = await fetchData<Contributor[]>(repo.contributors_url);

      for (const contributor of contributorsData) {
        if (!contributors.some((c) => c.login === contributor.login)) {
          console.log(`Getting data for the contributor ${contributor.login}`);
          const userDetails = await fetchData<UserDetails>(
            `https://api.github.com/users/${contributor.login}`
          );

          contributors.push({
            id: contributor.id,
            name: userDetails.name || contributor.login,
            login: contributor.login,
          });
        }
      }
    }

    console.log("Writing contributors data to file...");
    await writeFile("../contributors.json", JSON.stringify(contributors, null, 2));
    console.log("Script completed successfully! Check contributors.json file.");
  } catch (error) {
    console.error("Error fetching contributors:", error);
  }
}

fetchContributorsData();
