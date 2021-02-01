"use strict"

// Inputs or Arguments required
// JIRA Username
// JIRA API token
// JIRA Project ID
// JIRA Ratehub atlassian Domain
// Release Identifier - current or next release

const core = require('@actions/core');
const JiraApi = require('jira-client');
const semver = require('semver');

const jiraUser = core.getInput('jira-username');
const jiraApiToken = core.getInput('jira-api-token');
const latestTag = core.getInput('latest-git-tag');
const atlassianDomain = core.getInput('atlassian-domain');
const projectId = core.getInput('jira-project-id');
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
        const ReleaseVersion = releaseVersionInfo.minorVer;
        return ReleaseVersion;
    } else if (release == 'next') {
        const versionInfo = incrementMinorVersion(latestTag, 'minor');
        const ReleaseVersion = versionInfo.bumpedVersion;
        return ReleaseVersion;
    }
    
}

async function checkVersion() {
  try {
    const project = await jira.getVersions(projectId);
    const existingVersion = project.find(o => o.name === finalReleaseVersion());
    console.log(existingVersion);
    if (existingVersion != undefined){
        const statusCode = '200';
        console.log(statusCode);
        core.setOutput('statusCode', statusCode);
    }else {
        console.log(finalReleaseVersion());
        const statusCode = '400';
        console.log(statusCode);
        core.setOutput('statusCode', statusCode);
    }

  } catch (err) {
        console.log("Error", err);
  }
}

checkVersion();


