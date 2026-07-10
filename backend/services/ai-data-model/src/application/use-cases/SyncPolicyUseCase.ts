import { AIExtractor } from '../ports/AIExtractor.js';
import { PolicyRepository } from '../ports/PolicyRepository.js';
import { InvariantEngine } from '../../domain/invariants/InvariantEngine.js';
import { ValidationError } from '../../domain/errors/ValidationError.js';
import { ExtractionError } from '../../domain/errors/ExtractionError.js';
import { SSEPublisher } from '../ports/SSEPublisher.js';
import { createNotification } from '../../domain/value-objects/Notification.js';
import type { SyncPolicyInput, SyncPolicyOutput } from '../dto/SyncPolicyDTO.js';

export class SyncPolicyUseCase {
  constructor(
    private readonly aiExtractor: AIExtractor,
    private readonly policyRepository: PolicyRepository,
    private readonly invariantEngine: InvariantEngine,
    private readonly ssePublisher: SSEPublisher,
  ) {}

  async execute(input: SyncPolicyInput, correlationId: string): Promise<SyncPolicyOutput> {
    if (!input.rules || input.rules.trim().length === 0) {
      throw new ValidationError('Policy text must not be empty');
    }

    this.ssePublisher.publish(
      createNotification('log', 'Extracting Rules',
        'Extracting rules from policy text...',
        correlationId),
    );

    let rules;
    try {
      rules = await this.aiExtractor.extractRules(input.rules);
    } catch (err) {
      if (err instanceof ExtractionError) {
        throw err;
      }
      throw new ExtractionError(`Extraction failed: ${(err as Error).message}`);
    }

    await this.policyRepository.seedPolicyEntities(rules);

    const invariants = await this.policyRepository.loadAllInvariants();
    this.invariantEngine.loadFromNeo4j(invariants);

    this.ssePublisher.publish(
      createNotification('info', 'Rules Synced',
        `${invariants.length} business rules loaded and synced`,
        correlationId),
    );

    return { rulesCount: rules.length };
  }
}
