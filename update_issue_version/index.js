"use strict"

// Inputs or Arguments required
// JIRA Username
// JIRA API token
// Ratehub atlassian Domain
// JIRA Project ID
// Commit Message - Event Trigger
// latest Tag 
// Issue ID to be updated
// Release identifier

const core = require('@actions/core');
const JiraApi = require('jira-client');
const semver = require('semver');

const jiraUser = core.getInput('jira-username');
const jiraApiToken = core.getInput('jira-api-token');
const atlassianDomain = core.getInput('atlassian-domain'); 
const projectId = core.getInput('jira-project-id');
const commitMessage = core.getInput('commit-message');
const latestTag = core.getInput('latest-git-tag');
const regex = core.getInput('regex');
const issueIdRegex = new RegExp(regex,'g');
const issueId = commitMessage.match(issueIdRegex);
const release = core.getInput('which-release');

const jira = new JiraApi({
  protocol: 'https',
  host: `${atlassianDomain}`,
  username: `${jiraUser}`,
  password: `${jiraApiToken}`,
  apiVersion: '3',
  strictSSL: true
});

function getSemVersion(currentVersion) {
    const trivialPatchBump = semver.clean(currentVersion);
    const minorVer = `${semver.major(trivialPatchBump)}.${semver.minor(trivialPatchBump)}.${semver.patch(trivialPatchBump)}`;
    const releaseBranchName = `release-v${minorVer}`;
    return { trivialPatchBump , minorVer, releaseBranchName };
}

function incrementMinorVersion(currentVersion, tagIdentifier) {
    const bumpedVersion = semver.inc(currentVersion, tagIdentifier);
    const updatedVer = `${semver.major(bumpedVersion)}.${semver.minor(bumpedVersion)}.${semver.patch(bumpedVersion)}`;               
    return { bumpedVersion, updatedVer };
}

function finalReleaseVersion(){
    if (release == 'current'){
        const releaseVersionInfo = getSemVersion(latestTag);
        const currentReleaseVersion = releaseVersionInfo.minorVer;
        const ReleaseVersion = {
        "fields": {
          "fixVersions": [{
              "name": `${currentReleaseVersion}`
              
        }]    
      }};
        return ReleaseVersion;
    } else if (release == 'next') {
        const versionInfo = incrementMinorVersion(latestTag, 'minor');
        const currentReleaseVersion = versionInfo.bumpedVersion;
        const ReleaseVersion = {
        "fields": {
          "fixVersions": [{
              "name": `${currentReleaseVersion}`
              
          }]    
        }
      };
        return ReleaseVersion;
    }
    
}

async function assignFixVersion() {
  try {
    const newVersion = await jira.updateIssue(issueId, finalReleaseVersion());
    console.log("FixVersion assigned");  
  } catch (err) {
    console.error("Unable to update the version\n", err.message);
  }
}

assignFixVersion();
