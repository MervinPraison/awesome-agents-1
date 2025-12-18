import { tool } from "ai";
import { getCurrentAgent } from "agents";
import type { MyAgent } from ".";
import { z } from "zod";
import { env } from "cloudflare:workers";

export const memoryInsert = tool({
  description: "Insert text at a specific location in a memory block.",
  inputSchema: z.object({
    label: z.string().describe("Which memory block to edit."),
    new_str: z.string().describe("Text to insert."),
    insert_line: z.number().describe("Line number (0 for beginning, -1 for end)")
  }),
  execute: async ({ label, new_str, insert_line }) => {
    const { agent } = getCurrentAgent<MyAgent>();
    if (!agent) throw new Error("Expected agent");

    if (!agent.memory.blocks.find((b) => b.label === label)) {
      return "Block not found";
    }

    const blocks = agent.memory.blocks.map((b) => {
      if (b.label === label) {
        const lines = b.value.split("\n");
        lines.splice(insert_line, 0, new_str);
        return { ...b, value: lines.join("\n"), lastUpdated: Date.now() };
      }
      return b;
    });

    agent.memory.blocks = blocks;
    return "Successfully inserted into memory block";
  }
});

export const memoryReplace = tool({
  description: "Replace a specific string in a memory block with a new string. Used for precise edits.",
  inputSchema: z.object({
    label: z.string().describe("Which memory block to edit"),
    old_str: z.string().describe("Exact text to find and replace"),
    new_str: z.string().describe("Replacement text")
  }),
  execute: async ({ label, old_str, new_str }) => {
    const { agent } = getCurrentAgent<MyAgent>();
    if (!agent) throw new Error("Expected agent");

    if (!agent.memory.blocks.find((b) => b.label === label)) {
      return "Block not found";
    }

    const blocks = agent.memory.blocks.map((b) => {
      if (b.label === label) {
        return {
          ...b,
          value: b.value.replaceAll(old_str, new_str),
          lastUpdated: Date.now()
        };
      }
      return b;
    });

    agent.memory.blocks = blocks;
    return "Successfully replaced in memory block";
  }
});

export const internetSearch = tool({
  description: "Search the internet for information",
  inputSchema: z.object({
    query: z.string().describe("The query to search for")
  }),
  execute: async ({ query }) => {
    console.log(query);
    const retries = 3;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.TAVILY_API_KEY}`
          },
          body: JSON.stringify({ query })
        });
        if (response.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        if (!response.ok) {
          throw new Error(`Failed to search: ${response.statusText}`);
        }
        return response.text();
      } catch (error) {
        if (i >= retries - 1) throw error;
      }
    }
    return "Error: Failed to search the internet";
  }
});

export const readWebsite = tool({
  description: "Read the contents of website(s) for information",
  inputSchema: z.object({
    urls: z.array(z.string()).describe("The URLs to read from")
  }),
  execute: async ({ urls }) => {
    console.log(urls);
    const retries = 3;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch("https://api.tavily.com/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.TAVILY_API_KEY}`
          },
          body: JSON.stringify({ urls })
        });
        if (response.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        if (!response.ok) {
          throw new Error(`Failed to read website: ${response.statusText}`);
        }
        return response.text();
      } catch (error) {
        if (i >= retries - 1) throw error;
      }
    }
    return "Error: Failed to read the website(s)";
  }
});

export const tools = {
  memoryInsert,
  memoryReplace,
  internetSearch,
  readWebsite
};
