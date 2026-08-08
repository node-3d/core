#define CHUNK_SIZE 256U

const float SPEED_LIMIT = 9.0f;
const float PREY_RADIUS = 150.0f;
const float PREY_RADIUS_SQ = PREY_RADIUS * PREY_RADIUS;
const float M2PIF = M_PI_F * 2.0f;

/**
 * A helper to interpret float buffers as 4D vectors.
 */
typedef struct { float x, y, z, w; } Xyzw;

/**
 * Update birds.
 */
__kernel
void update(
	const uint count,
	const float dt,
	const float BOUNDS,
	const float predatorX,
	const float predatorY,
	const float separation,
	const float alignment,
	const float cohesion,
	__global Xyzw* ioPosition,
	__global Xyzw* ioVelocity
) {
	uint i = get_global_id(0);
	if (i >= count) {
		return;
	}
	
	float3 velocity = (float3)(ioVelocity[i].x, ioVelocity[i].y, ioVelocity[i].z);
	float3 position = (float3)(ioPosition[i].x, ioPosition[i].y, ioPosition[i].z);
	float phase = ioPosition[i].w;
	
	float3 predator = (float3)(predatorX, predatorY, 0.f);
	float zoneRadius = separation + alignment + cohesion;
	float separationThresh = separation / zoneRadius;
	float alignmentThresh = (separation + alignment) / zoneRadius;
	float zoneRadiusSquared = zoneRadius * zoneRadius;
	float separationSquared = separation * separation;
	float cohesionSquared = cohesion * cohesion;
	float limit = SPEED_LIMIT;
	
	float dist;
	float3 dir; // direction
	float distSquared;
	float f;
	float percent;
	
	dir = predator - position;
	dir.z = 0.0f;
	distSquared = dot(dir, dir);
	
	// move birds away from predator
	if (distSquared < PREY_RADIUS_SQ) {
		f = (distSquared / PREY_RADIUS_SQ - 1.f) * dt * 100.f;
		velocity += normalize(dir) * f;
		limit += 5.0f;
	}
	
	// Attract flocks to the center
	dir = position;
	dir.y *= 2.5f;
	velocity -= normalize(dir) * dt * 5.f;
	
	// Optimize memory access with chunked local groups
	int chunkCount = count / CHUNK_SIZE;
	uint iLocal = get_local_id(0);
	__local float3 positionLocal[CHUNK_SIZE];
	__local float3 velocityLocal[CHUNK_SIZE];
	
	// For each chunk:
	//  - load N positions and velocities into local
	//  - then work on those local N from every thread
	for (uint k = 0U; k < chunkCount; k++) {
		barrier(CLK_LOCAL_MEM_FENCE);
		
		uint idx = k * CHUNK_SIZE + iLocal;
		float3 otherPosition = (float3)(ioPosition[idx].x, ioPosition[idx].y, ioPosition[idx].z);
		float3 otherVelocity = (float3)(ioVelocity[idx].x, ioVelocity[idx].y, ioVelocity[idx].z);
		positionLocal[iLocal] = otherPosition;
		velocityLocal[iLocal] = otherVelocity;
		
		barrier(CLK_LOCAL_MEM_FENCE);
		
		for (uint j = 0U; j < CHUNK_SIZE; j++) {
			float3 birdPosition = positionLocal[j];
			float3 birdVelocity = velocityLocal[j];
			dir = birdPosition - position;
			distSquared = dot(dir, dir);
			
			if (distSquared < 0.0001f || distSquared > zoneRadiusSquared) {
				continue;
			}
			
			dist = half_sqrt(distSquared);
			percent = distSquared / zoneRadiusSquared;
			
			if (percent < separationThresh) { // low
				// Separation - Move apart for comfort
				f = (separationThresh / percent - 1.0f) * dt;
				velocity -= dir * f / dist;
				continue;
			}
			
			if (percent < alignmentThresh) { // high
				// Alignment - fly the same direction
				float threshDelta = alignmentThresh - separationThresh;
				float adjustedPercent = (percent - separationThresh) / threshDelta;
				
				f = (0.5f - cos(adjustedPercent * M2PIF) * 0.5f + 0.5f) * dt;
				velocity += normalize(birdVelocity) * f;
				continue;
			}
			
			// Attraction / Cohesion - move closer
			float threshDelta = 1.0f - alignmentThresh;
			float adjustedPercent = 1.f;
			if (threshDelta >= 0.0001f) {
				adjustedPercent = (percent - alignmentThresh) / threshDelta;
			}
			
			f = (0.5f - (cos(adjustedPercent * M2PIF) * -0.5f + 0.5f)) * dt;
			velocity += dir * f / dist;
		}
	}
	
	// Speed Limits
	if (length(velocity) > limit) {
		velocity = normalize(velocity) * limit;
	}
	
	ioVelocity[i].x = velocity.x;
	ioVelocity[i].y = velocity.y;
	ioVelocity[i].z = velocity.z;
	
	position += velocity * dt * 15.f;
	phase = fmod(
		phase + dt + length(velocity.xz) * dt * 3.f + max(velocity.y, 0.f) * dt * 6.f,
		M_PI_F * 20.f
	);
	
	ioPosition[i].x = position.x;
	ioPosition[i].y = position.y;
	ioPosition[i].z = position.z;
	ioPosition[i].w = phase;
}
