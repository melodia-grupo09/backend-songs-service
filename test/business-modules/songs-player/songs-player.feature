Feature: Songs Player

  Background:
    Given a song with title "Stream Song" and file "test_song.mp3"
    And the response status code is 201

  Scenario: Stream a song
    When I request to stream the song "Stream Song"
    Then the response status code is 206
    And the response header "Content-Type" should be "audio/ogg"
    And the response body should match the file "test_song.mp3"

  Scenario: Stream a video
    Given I add a video "test_video.mp4" to the song "Stream Song"
    When I request to stream the video playlist provided by the server
    Then the response status code is 200
    And the response header "Content-Type" should be "application/x-mpegURL"
    And the response body should match the file "playlist.m3u8"
