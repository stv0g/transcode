#include <stdint.h>

int main ( void ) {
	uint8_t a = 2;
	uint8_t b = 23;

	again:

	if (a & b) {
		b--;

		goto again;
	}
	else {
		a--;
	}

	a += b;

	return 0;
}
