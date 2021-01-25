"use strict"

// Inputs or Arguments required
// JIRA Username
// JIRA API token
// JIRA Project ID
// Release identifier
// latestTag
// Ratehub atlassian Domain
// JIRA Authentication object

const core = require('@actions/core');
const JiraApi = require('jira-client');
const semver = require('semver');

const jiraUser = core.getInput('jira-username');
const jiraApiToken = core.getInput('jira-api-token');
const latestTag = core.getInput('latest-git-tag');
const release = core.getInput('which-release');
const atlassianDomain = core.getInput('atlassian-domain');
const projectId = core.getInput('jira-project-id');

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
        "name": `${currentReleaseVersion}`,
        "projectId": `${projectId}`
        };
        return ReleaseVersion;
    } else if (release == 'next') {
        const versionInfo = incrementMinorVersion(latestTag, 'minor');
        const currentReleaseVersion = versionInfo.bumpedVersion;
        console.log(currentReleaseVersion);
        const ReleaseVersion = {
        "name": `${currentReleaseVersion}`,
        "projectId": `${projectId}`
        };
        return ReleaseVersion;
    }
    
}

async function createReleaseVersion() {
  try {
    const newVersion = await jira.createVersion(finalReleaseVersion());
    console.log(newVersion);
    core.exportVariable('version', newVersion.name);
    core.setOutput('version', newVersion.name);
    const statusCode = '200';
    core.setOutput('statusCode', statusCode);  
  } catch (err) {
    core.setOutput('statusCode', err.statusCode);
    console.log(err);
  }
}

createReleaseVersion();