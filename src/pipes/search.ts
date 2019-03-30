import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchFilter'
})
@Injectable()
export class SearchPipe implements PipeTransform {
  // SearchPipe
  // Filter user search results for name or username excluding the excludedIds.
  transform(accounts: any[], data: [[any], any]): any {
    let excludedIds = data[0];
    var term: string = data[1];
    if (!accounts) {
      return;
    } else if (!excludedIds) {
      return accounts;
    } else if (excludedIds && !term) {
      return accounts.filter((account) => excludedIds.indexOf(account.userId) == -1);
    } else {
      term = term.toLowerCase();
      return accounts.filter((account) => excludedIds.indexOf(account.userId) == -1 && (account.name.toLowerCase().indexOf(term) > -1 || account.username.toLowerCase().indexOf(term) > -1));
    }
  }
}
