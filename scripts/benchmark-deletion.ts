
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function mockDeleteFromR2(key: string) {
  await delay(100);
  if (key.includes("error")) throw new Error("Mock R2 Error");
}

// Mock B2 deletion as well, though simpler for benchmark
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function mockDeleteFromB2(_key: string, _id: string) {
  await delay(100);
  // if (_key.includes("error")) throw new Error("Mock B2 Error");
}

const FILES_COUNT = 20;
const mockFiles = Array.from({ length: FILES_COUNT }, (_, i) => ({
  fileKey: `file-${i}`,
  fileId: `id-${i}`
}));

async function serialDeletion() {
  console.log("Starting Serial Deletion...");
  const start = performance.now();
  const errors: string[] = [];

  for (const resource of mockFiles) {
    try {
      await mockDeleteFromR2(resource.fileKey);
    } catch (_err) {
      errors.push(resource.fileKey);
    }
  }

  console.log(`Errors: ${errors.length}`);
  const end = performance.now();
  console.log(`Serial Deletion took ${(end - start).toFixed(2)}ms`);
  return end - start;
}

async function parallelDeletion() {
  console.log("Starting Parallel Deletion...");
  const start = performance.now();

  const results = await Promise.all(
    mockFiles.map(async (resource) => {
      try {
        await mockDeleteFromR2(resource.fileKey);
        return null;
      } catch (_err) {
        return resource.fileKey;
      }
    })
  );

  const errors = results.filter((e): e is string => e !== null);
  console.log(`Errors: ${errors.length}`);

  const end = performance.now();
  console.log(`Parallel Deletion took ${(end - start).toFixed(2)}ms`);
  return end - start;
}

async function main() {
  console.log(`Benchmarking with ${FILES_COUNT} files and 100ms simulated latency per file.`);

  const serialTime = await serialDeletion();
  const parallelTime = await parallelDeletion();

  const improvement = serialTime / parallelTime;
  console.log(`\nImprovement: ${improvement.toFixed(2)}x faster`);
}

main().catch(console.error);
