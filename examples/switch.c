#include <stdint.h>

int main ( void ) {
	char hello[] = "Hello World!";
	char *str_p = hello;

	uint8_t l_count = 0;
	uint8_t o_count = 0;
	uint8_t else_count = 0;


	do {
		switch (*str_p) {
			case 'o':
				o_count++;
				break;

			case 'l':
				l_count++;
				break;

			default:
				else_count++;
		}

		++str_p;
	} while (*str_p);

}
