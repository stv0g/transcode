transcode kompiliert/assembliert ANSI C und Assembler in Maschinencode und umgekehrt.
Dabei wird mit Hilfe von Debugging Informationen ein Bezug zwischen Zeilen im C-Code und den Mnemonics hergestellt.
Durch Auswählen von Zeilen werden Bezüge direkt durch Hervorhebungen dargestellt.

transcode ist im Rahmen der Vorlesung 'Grundlagen der Informatik 2' von Prof. Roßmann
als Beitrag für den Fellow Student Enlightment Award an der RWTH Aachen entstanden.

Eine Demo Installation ist hier verfügbar: http://t0.0l.de/transcode/

## Installation ##

transcode benötigt einen Webserver, PHP Interpreter und den AVR C Compiler
aus der Gnu Compiler Collection (avr-gcc).

*  Apache (http://httpd.apache.org/)
*  PHP5 (http://php.net)
*  GCC (http://gcc.gnu.org/)
   Use `configure --target=avr --enable-languages="c"' to configure GCC. 

PHP darf nicht im "Safemode" laufen, da das Skript den Compiler mit exec() aufrufen muss.

Getestet und entwickelt wurde mit den aktuellsten Versionen der oben genannten Software unter Debian Squeeze.

### Ubuntu/Debian ###

    sudo apt-get install apache2 php5 libapache2-mod-php5 avr-gcc

###

## Lizenzierung ##

transcode is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
any later version.

transcode is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with transode. If not, see <http://www.gnu.org/licenses/>.

Copyright (c) 2011, Steffen Vogel <info@steffenvogel.de>
