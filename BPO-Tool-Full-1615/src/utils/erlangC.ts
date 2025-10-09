interface ErlangCInput {
  callsPerInterval: number;
  averageHandleTime: number;
  intervalMinutes: number;
  targetServiceLevel: number;
  targetAnswerTime: number;
}

interface ErlangCResult {
  requiredAgents: number;
  trafficIntensity: number;
  occupancy: number;
  serviceLevel: number;
  averageSpeedOfAnswer: number;
  probabilityOfWaiting: number;
  averageWaitTime: number;
}

interface StaffingScenario {
  agents: number;
  serviceLevel: number;
  asa: number;
  occupancy: number;
  probabilityOfWaiting: number;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function erlangC(agents: number, trafficIntensity: number): number {
  if (agents <= trafficIntensity) return 1;

  let sum = 0;
  for (let i = 0; i < agents; i++) {
    sum += Math.pow(trafficIntensity, i) / factorial(i);
  }

  const numerator = Math.pow(trafficIntensity, agents) / factorial(agents);
  const denominator = sum + numerator * (agents / (agents - trafficIntensity));

  return numerator / denominator;
}

function calculateServiceLevel(
  agents: number,
  trafficIntensity: number,
  targetAnswerTime: number,
  averageHandleTime: number
): number {
  const pw = erlangC(agents, trafficIntensity);
  const exponent = -(agents - trafficIntensity) * (targetAnswerTime / averageHandleTime);
  return 1 - (pw * Math.exp(exponent));
}

function calculateASA(
  agents: number,
  trafficIntensity: number,
  averageHandleTime: number
): number {
  const pw = erlangC(agents, trafficIntensity);
  return (pw * averageHandleTime) / (agents - trafficIntensity);
}

export function calculateErlangC(input: ErlangCInput): ErlangCResult {
  const { callsPerInterval, averageHandleTime, intervalMinutes, targetServiceLevel, targetAnswerTime } = input;

  const trafficIntensity = (callsPerInterval * averageHandleTime) / intervalMinutes;

  let requiredAgents = Math.ceil(trafficIntensity);
  let serviceLevel = 0;

  while (serviceLevel < targetServiceLevel / 100 && requiredAgents < 1000) {
    requiredAgents++;
    serviceLevel = calculateServiceLevel(
      requiredAgents,
      trafficIntensity,
      targetAnswerTime,
      averageHandleTime
    );
  }

  const probabilityOfWaiting = erlangC(requiredAgents, trafficIntensity);
  const averageSpeedOfAnswer = calculateASA(requiredAgents, trafficIntensity, averageHandleTime);
  const occupancy = trafficIntensity / requiredAgents;
  const averageWaitTime = probabilityOfWaiting * averageHandleTime / (requiredAgents - trafficIntensity);

  return {
    requiredAgents,
    trafficIntensity,
    occupancy: occupancy * 100,
    serviceLevel: serviceLevel * 100,
    averageSpeedOfAnswer,
    probabilityOfWaiting: probabilityOfWaiting * 100,
    averageWaitTime,
  };
}

export function generateStaffingScenarios(input: ErlangCInput): StaffingScenario[] {
  const { callsPerInterval, averageHandleTime, intervalMinutes, targetAnswerTime } = input;
  const trafficIntensity = (callsPerInterval * averageHandleTime) / intervalMinutes;

  const scenarios: StaffingScenario[] = [];
  const minAgents = Math.max(1, Math.ceil(trafficIntensity));
  const maxAgents = minAgents + 20;

  for (let agents = minAgents; agents <= maxAgents; agents++) {
    const serviceLevel = calculateServiceLevel(agents, trafficIntensity, targetAnswerTime, averageHandleTime);
    const asa = calculateASA(agents, trafficIntensity, averageHandleTime);
    const occupancy = (trafficIntensity / agents) * 100;
    const probabilityOfWaiting = erlangC(agents, trafficIntensity) * 100;

    scenarios.push({
      agents,
      serviceLevel: serviceLevel * 100,
      asa,
      occupancy,
      probabilityOfWaiting,
    });
  }

  return scenarios;
}

export function calculateShrinkage(factors: {
  breaks: number;
  lunch: number;
  training: number;
  meetings: number;
  other: number;
}): number {
  const totalMinutes = factors.breaks + factors.lunch + factors.training + factors.meetings + factors.other;
  return (totalMinutes / 480) * 100;
}

export function adjustForShrinkage(requiredAgents: number, shrinkagePercent: number): number {
  return Math.ceil(requiredAgents / (1 - shrinkagePercent / 100));
}
