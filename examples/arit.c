#include <stdint.h>

int main ( void ) {
	uint8_t foo, bar, tor, res;

	foo = 3;
	bar = 27;
	tor = 99;

	res = 3 + 4;		/* gets optimized */
	res = tor * bar; 
	res = bar / tor;	/* subroutine */
	res = bar & foo;
	res = bar % foo;

	return 0;
}
