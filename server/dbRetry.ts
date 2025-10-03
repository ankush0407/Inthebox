export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      const isNeonEndpointError = 
        error?.message?.includes('endpoint has been disabled') ||
        error?.code === 'XX000';
      
      if (isNeonEndpointError && attempt < maxRetries) {
        const waitTime = delayMs * Math.pow(2, attempt - 1);
        console.log(
          `Database endpoint suspended, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`
        );
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}
