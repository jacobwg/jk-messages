atom_feed :language => 'en-US' do |feed|
  feed.title @title
  feed.updated @updated

  @messages.each do |item|
    next if item.updated_at.blank?

    feed.entry(item) do |entry|
      #entry.url date_path([item.time_cst.year, item.time_cst.month, item.time_cst.day].join('-'))
      #entry.title 'J & K'
      #entry.content auto_link(simple_format(h(item.body)), :sanitize => false)

      entry.title 'there'
      entry.content 'hi'
      entry.url 'http://google.com'

      entry.updated  Time.now #(item.time_cst.strftime("%Y-%m-%dT%H:%M:%SZ"))

      entry.author do |author|
        author.name 'Jacob'
      end
    end
  end
end