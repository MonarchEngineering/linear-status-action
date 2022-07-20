import * as core from '@actions/core';
import { parseInputIdentifiers, parseInputStateMap, parseInputSkipIssues } from './input-handling';
import { lookupTicketsByPR } from './pr-lookup';
import * as github from '@actions/github';
import { splitLinearIdentifiersByTeam, updateStatusOfLinearTickets } from './linear-status-update';

async function run(): Promise<void> {
  try {
    const identifiersAsString: string = core.getInput('pr-ids');
    const stateMapString: string = core.getInput('state-id-by-team');
    const skipIssues: string = core.getInput('skip-issues-in-states');
    const isDryRun = core.getBooleanInput('dry-run');

    const githubContext = github.context;
    const { owner, repo } = githubContext.repo;
    const identifiers = parseInputIdentifiers(identifiersAsString);
    const skipIssuesInStates = parseInputSkipIssues(skipIssues);
    const stateMap = parseInputStateMap(stateMapString);

    core.info(`Executing action with identifiers ${identifiers} and state maps ${stateMapString}`);

    // Look up each PR and get all the Linear tickets associated with each PR
    const allLinearTicketIdentifiers = await lookupTicketsByPR(identifiers, owner, repo);
    core.info(`Found tickets ${allLinearTicketIdentifiers}`);

    // Split all linear ticket identifiers into teams
    const linearTicketIdentifiersByTeam = splitLinearIdentifiersByTeam(allLinearTicketIdentifiers);

    // Iterate over each team, and use the state ID for each team to update the tickets.
    for (const [team, linearIdentifiers] of Object.entries(linearTicketIdentifiersByTeam)) {
      // Change the status of each ticket
      const stateId = stateMap[team];
      if (!stateId) {
        core.error(`Unable to find a stateId for team ${team}. Skipping the team`);
        continue;
      }

      await updateStatusOfLinearTickets(linearIdentifiers, stateId, skipIssuesInStates, isDryRun);
    }

    core.info('Action finshed executing');
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Main action failed with error: ${error.message}`);
      core.setFailed(error.message);
    } else {
      core.error('Main action failed with unknown error type');
      core.setFailed('Unknown error type');
    }
  }
}

run();
