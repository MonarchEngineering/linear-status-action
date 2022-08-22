import * as core from '@actions/core';
import { LinearClient } from '@linear/sdk';

export const updateStatusOfLinearTickets = async (
  identifiers: string[],
  stateId: string,
  skipIssuesInStates: string[],
  isDryRun: boolean,
) => {
  const identifiersAsString = core.getInput('linearToken');

  const linearClient = new LinearClient({ apiKey: identifiersAsString });

  // Collect UUID based identifiers
  // This is pretty inefficient, but Linear doesn't currently have a way to
  // batch these IDs, or use the identifiers (ENG-123) to batch update issues. :(

  // Use a set to avoid duplicates, which will cause an API error
  const uuidIdentifiersSet = new Set();
  for (const identifier of identifiers) {
    try {
      const issue = await linearClient.issue(identifier);
      const issueState = await issue.state;

      if (issueState === undefined || skipIssuesInStates.includes(issueState.id)) {
        core.info(`Skipping issue ${identifier} because it is in state ${issueState?.name}`);
        continue;
      }

      uuidIdentifiersSet.add(issue.id);
    } catch (error) {
      core.error(`Error fetching issue with identifier ${identifier}, error: ${error}`);
    }
  }

  // Chunk into sizes of 50 to do the batch updates
  const chunkSize = 50;
  const uuidIdentifiersList = Array.from(uuidIdentifiersSet);

  for (let i = 0; i < uuidIdentifiersList.length; i += chunkSize) {
    try {
      const uuidIdentifiersChunk = uuidIdentifiersList.slice(i, i + chunkSize);
      core.info(`Batch updating to state: ${stateId}, ${uuidIdentifiersChunk}`);

      if (!isDryRun) {
        await linearClient.issueBatchUpdate(uuidIdentifiersChunk, { stateId });
      }
    } catch (error) {
      core.error(`Error updating issues: ${error}`);
    }
  }
};

// Splits an array of identifiers into a map where the team
// is the key, and all the identifiers belonging to that team are in an array value for that key
export const splitLinearIdentifiersByTeam = (identifiers: string[]) => {
  const mapOfIdentifiers: { [key: string]: string[] } = {};

  for (const identifer of identifiers) {
    const components = identifer.split('-');
    if (components.length !== 2) {
      throw new Error('Identifier malformed');
    }

    const team = components[0];
    let identifiersForTeam = mapOfIdentifiers[team];
    if (!identifiersForTeam) {
      identifiersForTeam = [identifer];
      mapOfIdentifiers[team] = identifiersForTeam;
    } else {
      identifiersForTeam.push(identifer);
    }
  }

  return mapOfIdentifiers;
};
