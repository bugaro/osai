export enum TraceEventType {
  Reasoning = 'reasoning',
  ToolCall = 'tool_call',
  ToolResult = 'tool_result',
  SecurityViolation = 'security_violation',
  FinalAnswer = 'final_answer',
}
