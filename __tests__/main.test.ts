/*
Copyright 2021 Expedia, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import * as github from '@actions/github'
import { context } from '@actions/github'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { run } from '../src/main'

// Capture environment variables before running tests
const cleanEnv = process.env

jest.mock('@aws-sdk/client-sns')
jest.mock('@actions/github')
const mockedSend = jest.fn().mockReturnValue({ MessageId: '1' })

describe('Publish', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env = {}
    process.env.INPUT_TOPIC_ARN =
      'arn:aws:sns:us-west-2:123456789123:spinnaker-github-actions'
    process.env.GITHUB_REPOSITORY = 'Org/actions-test-trigger'
    process.env.GITHUB_SHA = 'long-sha'
    process.env.GITHUB_REF = 'main'
    SNSClient.prototype.send = mockedSend
  })

  test('Run with no options', async () => {
    // Arrange
    const region = 'us-west-2'

    const input = {
      Message:
        '{"repository":"Org/actions-test-trigger","commit":"long-sha","ref":"main","githubEventName":"","githubAddMod":{},"githubActor":"","githubAction":"","docker":[],"parameters":{},"messageAttributes":{}}',
      TopicArn: 'arn:aws:sns:us-west-2:123456789123:spinnaker-github-actions'
    }

    // Act
    await run()

    // Assert
    expect(SNSClient).toBeCalledWith({ region })
    expect(PublishCommand).toBeCalledWith(input)
    expect(mockedSend).toBeCalledTimes(1)
  })

  test('No REF passed in', async () => {
    // Arrange
    const region = 'us-west-2'
    process.env.GITHUB_REF = ''

    const input = {
      Message:
        '{"repository":"Org/actions-test-trigger","commit":"long-sha","ref":"","githubEventName":"","githubAddMod":{},"githubActor":"","githubAction":"","docker":[],"parameters":{},"messageAttributes":{}}',
      TopicArn: 'arn:aws:sns:us-west-2:123456789123:spinnaker-github-actions'
    }

    // Act
    await run()

    // Assert
    expect(SNSClient).toBeCalledWith({ region })
    expect(PublishCommand).toBeCalledWith(input)
    expect(mockedSend).toBeCalledTimes(1)
  })

  test('With Parameters and Message Attributes', async () => {
    // Arrange
    const region = 'us-west-2'
    process.env.INPUT_PARAMETERS = 'parameter1: value1\nparameter2: value2'
    process.env.INPUT_MESSAGE_ATTRIBUTES = '12345'

    const input = {
      Message:
        '{"repository":"Org/actions-test-trigger","commit":"long-sha","ref":"main","githubEventName":"","githubAddMod":{},"githubActor":"","githubAction":"","docker":[],"parameters":{"parameter1":"value1","parameter2":"value2"},"messageAttributes":"12345"}',
      TopicArn: 'arn:aws:sns:us-west-2:123456789123:spinnaker-github-actions'
    }

    // Act
    await run()

    // Assert
    expect(SNSClient).toBeCalledWith({ region })
    expect(PublishCommand).toBeCalledWith(input)
    expect(mockedSend).toBeCalledTimes(1)
  })

  test('With Git Add Modified Attribute', async () => {
    // Arrange
    const region = 'us-west-2'
    process.env.INPUT_GIT_ADD_MODIFIED =
      '{".github/workflows/test.yaml":"https://api.github.com/repos/Org/actions-test-trigger/contents/.github/workflows/test.yaml","README.md":"https://api.github.com/repos/Org/actions-test-trigger/contents/README.md"}'

    const input = {
      Message:
        '{"repository":"Org/actions-test-trigger","commit":"long-sha","ref":"main","githubEventName":"","githubAddMod":{".github/workflows/test.yaml":"https://api.github.com/repos/Org/actions-test-trigger/contents/.github/workflows/test.yaml","README.md":"https://api.github.com/repos/Org/actions-test-trigger/contents/README.md"},"githubActor":"","githubAction":"","docker":[],"parameters":{},"messageAttributes":{}}',
      TopicArn: 'arn:aws:sns:us-west-2:123456789123:spinnaker-github-actions'
    }

    // Act
    await run()

    // Assert
    expect(SNSClient).toBeCalledWith({ region })
    expect(PublishCommand).toBeCalledWith(input)
    expect(mockedSend).toBeCalledTimes(1)
  })

  test('With Docker Attribute', async () => {
    // Arrange
    const region = 'us-west-2'
    process.env.INPUT_DOCKER_IMAGES =
      '["index.docker.io/hashicorp/http-echo:latest","index.docker.io/library/nginx:latest"]'

    const input = {
      Message:
        '{"repository":"Org/actions-test-trigger","commit":"long-sha","ref":"main","githubEventName":"","githubAddMod":{},"githubActor":"","githubAction":"","docker":["index.docker.io/hashicorp/http-echo:latest","index.docker.io/library/nginx:latest"],"parameters":{},"messageAttributes":{}}',
      TopicArn: 'arn:aws:sns:us-west-2:123456789123:spinnaker-github-actions'
    }

    // Act
    await run()

    // Assert
    expect(SNSClient).toBeCalledWith({ region })
    expect(PublishCommand).toBeCalledWith(input)
    expect(mockedSend).toBeCalledTimes(1)
  })
})

describe('fail', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...cleanEnv }
  })

  test('no ARN', async () => {
    // Arrange
    const mockedSend = jest.fn()

    // Act
    await run()

    // Assert
    expect(SNSClient).not.toBeCalled()
    expect(PublishCommand).not.toBeCalled()
    expect(mockedSend).not.toBeCalled()
  })
})
