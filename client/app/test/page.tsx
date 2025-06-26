"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Square, Volume2 } from "lucide-react";

export default function AudioTestPage() {
  const [audioId, setAudioId] = useState("123"); // Default to the file in temp folder
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [blobUrl, setBlobUrl] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  // Method 1: Direct URL usage
  const directAudioUrl = `/api/getAudio?id=${audioId}`;

  // Method 2: Fetch and create blob URL
  const fetchAudioBlob = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await fetch(`/api/getAudio?id=${audioId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audio");
    } finally {
      setIsLoading(false);
    }
  };

  // Custom audio controls
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Audio API Demo</h1>
        <p className="text-muted-foreground">Test different ways to play audio from your API</p>
      </div>

      {/* Audio ID Input */}
      <Card>
        <CardHeader>
          <CardTitle>Audio ID</CardTitle>
          <CardDescription>Enter the ID of the audio file you want to test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={audioId}
              onChange={(e) => setAudioId(e.target.value)}
              placeholder="Enter audio ID (e.g., 123)"
              className="flex-1"
            />
            <Button onClick={() => window.location.reload()}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Method 1: Basic HTML Audio Player */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Method 1: Basic HTML Audio Player
          </CardTitle>
          <CardDescription>
            Simple HTML audio element with built-in controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <audio controls className="w-full" key={audioId}>
            <source src={directAudioUrl} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
          <p className="text-sm text-muted-foreground mt-2">
            URL: <code className="bg-muted px-1 py-0.5 rounded">{directAudioUrl}</code>
          </p>
        </CardContent>
      </Card>

      {/* Method 2: Custom Audio Player */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Method 2: Custom Audio Player
          </CardTitle>
          <CardDescription>
            Custom controls using JavaScript Audio API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <audio
            ref={audioRef}
            src={directAudioUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={(e) => setError("Audio playback error")}
          />
          
          <div className="flex gap-2 items-center">
            <Button onClick={togglePlay} variant="outline" size="sm">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button onClick={stopAudio} variant="outline" size="sm">
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Method 3: Blob URL Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Method 3: Fetch and Create Blob URL
          </CardTitle>
          <CardDescription>
            Fetch audio data and create a blob URL for playback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={fetchAudioBlob} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Loading..." : "Fetch Audio as Blob"}
          </Button>
          
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              Error: {error}
            </div>
          )}
          
          {blobUrl && (
            <div className="space-y-2">
              <audio controls className="w-full">
                <source src={blobUrl} type="audio/wav" />
              </audio>
              <p className="text-sm text-muted-foreground">
                Blob URL: <code className="bg-muted px-1 py-0.5 rounded text-xs">{blobUrl.substring(0, 50)}...</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>Here's how to implement these methods in your components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Method 1: Direct URL</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`<audio controls>
  <source src="/api/getAudio?id={audioId}" type="audio/wav" />
</audio>`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Method 2: JavaScript Control</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`const audioRef = useRef<HTMLAudioElement>(null);
const [isPlaying, setIsPlaying] = useState(false);

const togglePlay = () => {
  if (audioRef.current) {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }
};`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Method 3: Blob URL</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`const response = await fetch('/api/getAudio?id=123');
const blob = await response.blob();
const blobUrl = URL.createObjectURL(blob);`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 