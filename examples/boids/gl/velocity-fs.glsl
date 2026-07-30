out vec4 fragColor;

uniform float time;
uniform float testing;
uniform float delta; // about 0.016
uniform float separationDistance; // 20
uniform float alignmentDistance; // 40
uniform float cohesionDistance; //
uniform float freedomFactor;
uniform vec3 predator;

const float width = resolution.x;
const float height = resolution.y;

const float PI = 3.141592653589793;
const float PI_2 = PI * 2.0;
// const float VISION = PI * 0.55;

float zoneRadius = 40.0;
float zoneRadiusSquared = 1600.0;

float separationThresh = 0.45;
float alignmentThresh = 0.65;

const float UPPER_BOUNDS = BOUNDS;
const float LOWER_BOUNDS = -UPPER_BOUNDS;
const float SPEED_LIMIT = 9.0;

void main() {
	zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
	separationThresh = separationDistance / zoneRadius;
	alignmentThresh = (separationDistance + alignmentDistance) / zoneRadius;
	zoneRadiusSquared = zoneRadius * zoneRadius;
	
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec3 birdPosition, birdVelocity;
	
	vec3 selfPosition = texture2D(texturePosition, uv).xyz;
	vec3 selfVelocity = texture2D(textureVelocity, uv).xyz;
	
	float dist;
	vec3 dir; // direction
	float distSquared;
	
	float separationSquared = separationDistance * separationDistance;
	float cohesionSquared = cohesionDistance * cohesionDistance;
	
	float f;
	float percent;
	
	vec3 velocity = selfVelocity;
	
	float limit = SPEED_LIMIT;
	
	dir = predator - selfPosition;
	dir.z = 0.0;
	dist = length(dir);
	distSquared = dist * dist;
	
	float preyRadius = 150.0;
	float preyRadiusSq = preyRadius * preyRadius;
	
	// move birds away from predator
	if (dist < preyRadius) {
		f = (distSquared / preyRadiusSq - 1.0) * delta * 100.;
		velocity += normalize(dir) * f;
		limit += 5.0;
	}
	
	// Attract flocks to the center
	vec3 central = vec3(0., 0., 0.);
	dir = selfPosition - central;
	dist = length(dir);
	
	dir.y *= 2.5;
	velocity -= normalize(dir) * delta * 5.;
	
	for (float y = 0.0; y < height; y++) {
		for (float x = 0.0; x < width; x++) {
			vec2 ref = vec2(x + 0.5, y + 0.5) / resolution.xy;
			birdPosition = texture2D(texturePosition, ref).xyz;
			
			dir = birdPosition - selfPosition;
			dist = length(dir);
			
			if (dist < 0.0001) continue;
			
			distSquared = dist * dist;
			
			if (distSquared > zoneRadiusSquared) continue;
			
			percent = distSquared / zoneRadiusSquared;
			
			if (percent < separationThresh) { // low
				// Separation - Move apart for comfort
				f = (separationThresh / percent - 1.0) * delta;
				velocity -= normalize(dir) * f;
			} else if (percent < alignmentThresh) { // high
				// Alignment - fly the same direction
				float threshDelta = alignmentThresh - separationThresh;
				float adjustedPercent = (percent - separationThresh) / threshDelta;
				
				birdVelocity = texture2D(textureVelocity, ref).xyz;
				
				f = (0.5 - cos(adjustedPercent * PI_2) * 0.5 + 0.5) * delta;
				velocity += normalize(birdVelocity) * f;
			} else {
				// Attraction / Cohesion - move closer
				float threshDelta = 1.0 - alignmentThresh;
				float adjustedPercent;
				if(threshDelta == 0.) adjustedPercent = 1.;
				else adjustedPercent = (percent - alignmentThresh) / threshDelta;
				
				f = (0.5 - (cos(adjustedPercent * PI_2) * -0.5 + 0.5)) * delta;
				
				velocity += normalize(dir) * f;
			}
		}
	}
	
	// Speed Limits
	if (length(velocity) > limit) {
		velocity = normalize(velocity) * limit;
	}
	
	gl_FragColor = vec4(velocity, 1.0);
}
