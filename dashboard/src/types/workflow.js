// Workflow data structures and types

export const WORKFLOW_TYPES = {
  LINEAR: 'linear',           // Simple chain: A -> B -> C
  PARALLEL: 'parallel',       // Parallel execution: A -> [B, C] -> D
  CONDITIONAL: 'conditional', // Conditional branching: A -> (condition) -> B or C
  LOOP: 'loop',              // Loop execution: A -> B -> (repeat if condition)
};

export const CONNECTION_TYPES = {
  PIPELINE_TO_PIPELINE: 'pipeline_to_pipeline',
  AGENT_TO_PIPELINE: 'agent_to_pipeline',
  PIPELINE_TO_AGENT: 'pipeline_to_agent',
};

export const WORKFLOW_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ERROR: 'error',
  PAUSED: 'paused',
};

// Connection between pipeline outputs and inputs
export class PipelineConnection {
  constructor(fromPipelineId, fromAgentIndex, toPipelineId, toAgentIndex = 0) {
    this.id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.fromPipelineId = fromPipelineId;
    this.fromAgentIndex = fromAgentIndex; // -1 means pipeline output, >=0 means specific agent
    this.toPipelineId = toPipelineId;
    this.toAgentIndex = toAgentIndex; // 0 means pipeline input, >=1 means specific agent
    this.condition = null; // For conditional connections
    this.transform = null; // For data transformation
    this.createdAt = new Date().toISOString();
  }

  // Check if this connection is valid
  isValid() {
    return this.fromPipelineId && this.toPipelineId && 
           this.fromPipelineId !== this.toPipelineId;
  }

  // Get connection description
  getDescription() {
    const fromDesc = this.fromAgentIndex === -1 ? 'Pipeline Output' : `Agent ${this.fromAgentIndex + 1}`;
    const toDesc = this.toAgentIndex === 0 ? 'Pipeline Input' : `Agent ${this.toAgentIndex}`;
    return `${fromDesc} → ${toDesc}`;
  }
}

// Workflow definition
export class Workflow {
  constructor(name, description = '') {
    this.id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = name;
    this.description = description;
    this.type = WORKFLOW_TYPES.LINEAR;
    this.pipelines = []; // Array of pipeline IDs
    this.connections = []; // Array of PipelineConnection objects
    this.status = WORKFLOW_STATUS.IDLE;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.lastExecutionDate = null;
    this.lastExecutionResult = null;
    this.lastExecutionError = null;
    this.lastExecutionLogs = [];
  }

  // Add a pipeline to the workflow
  addPipeline(pipelineId) {
    if (!this.pipelines.includes(pipelineId)) {
      this.pipelines.push(pipelineId);
      this.updatedAt = new Date().toISOString();
    }
  }

  // Remove a pipeline from the workflow
  removePipeline(pipelineId) {
    this.pipelines = this.pipelines.filter(id => id !== pipelineId);
    // Remove all connections involving this pipeline
    this.connections = this.connections.filter(conn => 
      conn.fromPipelineId !== pipelineId && conn.toPipelineId !== pipelineId
    );
    this.updatedAt = new Date().toISOString();
  }

  // Add a connection between pipelines
  addConnection(connection) {
    if (connection.isValid()) {
      this.connections.push(connection);
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // Remove a connection
  removeConnection(connectionId) {
    this.connections = this.connections.filter(conn => conn.id !== connectionId);
    this.updatedAt = new Date().toISOString();
  }

  // Get all connections for a specific pipeline
  getConnectionsForPipeline(pipelineId) {
    return this.connections.filter(conn => 
      conn.fromPipelineId === pipelineId || conn.toPipelineId === pipelineId
    );
  }

  // Get input connections for a pipeline
  getInputConnections(pipelineId) {
    return this.connections.filter(conn => conn.toPipelineId === pipelineId);
  }

  // Get output connections for a pipeline
  getOutputConnections(pipelineId) {
    return this.connections.filter(conn => conn.fromPipelineId === pipelineId);
  }

  // Check if workflow is valid (has no cycles, all pipelines connected)
  isValid() {
    // Check for cycles using depth-first search
    const visited = new Set();
    const recStack = new Set();

    const hasCycle = (pipelineId) => {
      if (recStack.has(pipelineId)) return true;
      if (visited.has(pipelineId)) return false;

      visited.add(pipelineId);
      recStack.add(pipelineId);

      const outputConnections = this.getOutputConnections(pipelineId);
      for (const conn of outputConnections) {
        if (hasCycle(conn.toPipelineId)) return true;
      }

      recStack.delete(pipelineId);
      return false;
    };

    // Check each pipeline for cycles
    for (const pipelineId of this.pipelines) {
      if (hasCycle(pipelineId)) return false;
    }

    return true;
  }

  // Get workflow execution order (topological sort)
  getExecutionOrder() {
    const inDegree = {};
    const graph = {};

    // Initialize
    for (const pipelineId of this.pipelines) {
      inDegree[pipelineId] = 0;
      graph[pipelineId] = [];
    }

    // Build graph and calculate in-degrees
    for (const conn of this.connections) {
      graph[conn.fromPipelineId].push(conn.toPipelineId);
      inDegree[conn.toPipelineId]++;
    }

    // Topological sort
    const queue = [];
    const result = [];

    // Add pipelines with no incoming connections
    for (const pipelineId of this.pipelines) {
      if (inDegree[pipelineId] === 0) {
        queue.push(pipelineId);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift();
      result.push(current);

      for (const neighbor of graph[current]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Check if all pipelines were processed
    if (result.length !== this.pipelines.length) {
      throw new Error('Workflow contains cycles and cannot be executed');
    }

    return result;
  }

  // Clone workflow
  clone() {
    const cloned = new Workflow(this.name, this.description);
    cloned.type = this.type;
    cloned.pipelines = [...this.pipelines];
    cloned.connections = this.connections.map(conn => new PipelineConnection(
      conn.fromPipelineId,
      conn.fromAgentIndex,
      conn.toPipelineId,
      conn.toAgentIndex
    ));
    return cloned;
  }
}

// Workflow execution state
export class WorkflowExecution {
  constructor(workflowId, workflow) {
    this.id = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.workflowId = workflowId;
    this.workflow = workflow;
    this.status = WORKFLOW_STATUS.IDLE;
    this.currentPipelineIndex = 0;
    this.executionOrder = workflow.getExecutionOrder();
    this.pipelineResults = {}; // Store results for each pipeline
    this.pipelineLogs = {}; // Store logs for each pipeline
    this.startTime = null;
    this.endTime = null;
    this.error = null;
    this.createdAt = new Date().toISOString();
  }

  // Start workflow execution
  start() {
    this.status = WORKFLOW_STATUS.RUNNING;
    this.startTime = new Date().toISOString();
    this.currentPipelineIndex = 0;
  }

  // Complete workflow execution
  complete(result) {
    this.status = WORKFLOW_STATUS.COMPLETED;
    this.endTime = new Date().toISOString();
    this.pipelineResults['final'] = result;
  }

  // Fail workflow execution
  fail(error) {
    this.status = WORKFLOW_STATUS.ERROR;
    this.endTime = new Date().toISOString();
    this.error = error;
  }

  // Get current pipeline to execute
  getCurrentPipeline() {
    if (this.currentPipelineIndex < this.executionOrder.length) {
      return this.executionOrder[this.currentPipelineIndex];
    }
    return null;
  }

  // Move to next pipeline
  nextPipeline() {
    this.currentPipelineIndex++;
  }

  // Store pipeline result
  setPipelineResult(pipelineId, result) {
    this.pipelineResults[pipelineId] = result;
  }

  // Get pipeline result
  getPipelineResult(pipelineId) {
    return this.pipelineResults[pipelineId];
  }

  // Store pipeline logs
  setPipelineLogs(pipelineId, logs) {
    this.pipelineLogs[pipelineId] = logs;
  }

  // Get pipeline logs
  getPipelineLogs(pipelineId) {
    return this.pipelineLogs[pipelineId];
  }

  // Check if workflow is complete
  isComplete() {
    return this.currentPipelineIndex >= this.executionOrder.length;
  }

  // Get execution progress
  getProgress() {
    if (this.executionOrder.length === 0) return 0;
    return (this.currentPipelineIndex / this.executionOrder.length) * 100;
  }
}
