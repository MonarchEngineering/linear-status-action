import * as core from '@actions/core';

export const parseInputIdentifiers = (identifiersAsString: string): number[] => {
  if (identifiersAsString.length === 0) {
    return [];
  }

  try {
    const identifiers = JSON.parse(identifiersAsString);
    return identifiers;
  } catch (error) {
    core.debug(`Error parsing input ${error}`);
    throw new Error('Error parsing input');
  }
};

export const parseInputStateMap = (stringStateMap: string): { [key: string]: string } => {
  if (stringStateMap.length === 0) {
    return {};
  }

  try {
    return JSON.parse(stringStateMap);
  } catch (error) {
    core.debug(`Error parsing state map input ${error}`);
    throw new Error('Error parsing state map input');
  }
};

export const parseInputSkipIssues = (identifiersAsString: string): string[] => {
  if (identifiersAsString.length === 0) {
    return [];
  }

  try {
    return JSON.parse(identifiersAsString);
  } catch (error) {
    core.debug(`Error parsing input ${error}`);
    throw new Error('Error parsing input');
  }
};
