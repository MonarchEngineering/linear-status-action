import * as core from '@actions/core';
import { LinearClient } from '@linear/sdk';

export const updateStatusOfLinearTickets = async (identifiers: string[], stateId: string, isDryRun: boolean) => {
  const identifiersAsString = core.getInput('linearToken');

  const linearClient = new LinearClient({ apiKey: identifiersAsString });

  // Collect UUID based identifiers
  // This is pretty inefficient, but Linear doesn't currently have a way to
  // batch betch these IDs, or use the identifiers (ENG-123) to batch update issues. :(
  const uuidIdentifiers = [];
  for (const identifier of identifiers) {
    try {
      const issue = await linearClient.issue(identifier);
      uuidIdentifiers.push(issue.id);
    } catch (error) {
      core.error(`Error fetching issue with identifier ${identifier}, error: ${error}`);
    }
  }

  // Chunk into sizes of 50 to do the batch updates
  const chunkSize = 50;
  for (let i = 0; i < uuidIdentifiers.length; i += chunkSize) {
    try {
      const uuidIdentifiersChunk = uuidIdentifiers.slice(i, i + chunkSize);
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
