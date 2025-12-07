Feature: Songs Management

  Background:
    Given a song with title "Test Song" and file "test_song.mp3"
    And the response status code is 201

  Scenario: Get a song by ID
    When I request the song "Test Song" by its ID
    Then the response status code is 200
    And the song title should be "Test Song"
    And the response should match the Song DTO structure

  Scenario: Search for a song
    When I search for songs with query "Test"
    Then the response status code is 200
    And the response should contain a song with title "Test Song"

  Scenario: Get random songs
    Given a song with title "Random Song" and file "test_song.mp3"
    When I request 5 random songs
    Then the response status code is 200
    And I should receive a list containing the song "Random Song"

  Scenario: Add video to a song
    Given a song with title "Video Song" and file "test_song.mp3"
    When I attach a video "test_video.mp4" to the song "Video Song"
    Then the response status code is 201
    And the song should have video available
    And the response should match the Song DTO structure

  Scenario: Upload a song with video
    When I upload a song "Song With Video" with file "test_song.mp3" and video "test_video.mp4"
    Then the response status code is 201
    And the song should have video available
    And the response should match the Song DTO structure
